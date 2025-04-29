use futures::future::join_all;
use nostr_sdk::nips::nip59::UnwrappedGift;
use nostr_sdk::{
    Alphabet, ClientBuilder, Event, EventBuilder, Filter, Keys, Kind, PublicKey, SingleLetterTag,
    Timestamp, UnsignedEvent,
};
use rand::{thread_rng, Rng};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::DiaryStore;

// Structure to hold gift wrap request parameters
#[derive(Deserialize, Serialize)]
pub struct GiftWrapRequest {
    pub nostr_id: String,         // ID of the diary event to gift wrap
    pub recipient_pubkey: String, // Public key of the recipient
}

// Structure to hold the gift wrap response
#[derive(Deserialize, Serialize)]
pub struct GiftWrapResponse {
    pub gift_wrap_event: String, // The gift-wrapped event as JSON
    pub gift_wrap_id: String,    // The ID of the gift-wrapped event
}

#[derive(Deserialize, Serialize)]
pub struct UnwrappedGiftResponse {
    pub sender_pubkey: String,
    pub gift_wrap_event: String,
}

// Generate a random timestamp up to 2 days in the past
// This helps obfuscate the real timestamp and prevents correlation attacks
fn random_past_timestamp() -> u64 {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    let two_days_secs = 2 * 24 * 60 * 60;
    let random_offset = thread_rng().gen_range(0..two_days_secs);

    now - random_offset
}

// Gets the diary event from the database by ID
fn get_diary_event(nostr_id: &str) -> Result<String, String> {
    let conn = crate::DB_CONNECTION.lock().unwrap();
    match conn.query_row(
        "SELECT nostr_event FROM diary_entries WHERE nostr_id = ?1",
        [nostr_id],
        |row| row.get::<_, String>(0),
    ) {
        Ok(event_json) => Ok(event_json),
        Err(e) => Err(format!("Failed to get Nostr event: {}", e)),
    }
}

// Tauri command to gift wrap a diary entry for private sharing
#[tauri::command]
pub async fn gift_wrap_diary(
    store: State<'_, Arc<DiaryStore>>,
    request: GiftWrapRequest,
) -> Result<GiftWrapResponse, String> {
    // Get the source diary event from the database
    let event_json = get_diary_event(&request.nostr_id)?;

    // Parse the event JSON into a Nostr Event
    let source_event: Event = match serde_json::from_str(&event_json) {
        Ok(event) => event,
        Err(e) => return Err(format!("Failed to parse Nostr event: {}", e)),
    };

    // Get the sender's keys
    let sender_keys = get_or_create_nostr_keys(&store)?;

    // Parse recipient's public key
    let recipient_pubkey = match PublicKey::from_hex(&request.recipient_pubkey) {
        Ok(pk) => pk,
        Err(e) => return Err(format!("Invalid recipient public key: {}", e)),
    };

    // Create a new unsigned event with the content and tags from the source event
    let kind = Kind::from(30027);
    let timestamp = Timestamp::from(random_past_timestamp());

    // Create a simple unsigned event with the necessary fields
    let rumor = UnsignedEvent {
        id: None, // Let the library compute the ID for us
        pubkey: sender_keys.public_key(),
        created_at: timestamp,
        kind,
        tags: source_event.tags.clone(),
        content: source_event.content.clone(),
    };

    // Create the final gift wrap that contains the rumor event
    // The gift wrap hides the author and content but indicates the recipient
    let gift_wrap = EventBuilder::gift_wrap(&sender_keys, &recipient_pubkey, rumor, None)
        .await
        .map_err(|e| format!("Failed to create gift wrapped event: {}", e))?;

    // Convert the gift wrap to JSON for transmission
    let gift_wrap_json = serde_json::to_string(&gift_wrap)
        .map_err(|e| format!("Failed to serialize gift wrap: {}", e))?;

    Ok(GiftWrapResponse {
        gift_wrap_event: gift_wrap_json,
        gift_wrap_id: gift_wrap.id.to_hex(),
    })
}

// Gets or creates Nostr keys for the user
fn get_or_create_nostr_keys(store: &Arc<DiaryStore>) -> Result<Keys, String> {
    let mut nostr_keys_guard = store.nostr_keys.lock().unwrap();

    if let Some(keys) = nostr_keys_guard.as_ref() {
        return Ok(keys.clone());
    }

    // Try to load existing keys
    if let Some(keys) = crate::load_nostr_keys() {
        *nostr_keys_guard = Some(keys.clone());
        return Ok(keys);
    }

    // Generate new keys
    println!("Generating new Nostr keys");
    let keys = Keys::generate();

    // Save the keys
    crate::save_nostr_keys(&keys)?;

    // Update the store
    *nostr_keys_guard = Some(keys.clone());

    Ok(keys)
}

// Command to share the gift-wrapped event to a relay
#[tauri::command]
pub async fn share_gift_wrap(gift_wrap_json: String, relay_url: String) -> Result<String, String> {
    // Parse the gift wrap JSON
    let gift_wrap: Event = match serde_json::from_str(&gift_wrap_json) {
        Ok(event) => event,
        Err(e) => return Err(format!("Failed to parse gift wrap: {}", e)),
    };

    // Create a client to publish the event
    //let keys: Keys = Keys::generate();
    // Create a client builder and build it with the keys
    let client = ClientBuilder::new().build();

    // Add the relay
    client
        .add_relay(relay_url.clone())
        .await
        .map_err(|e| format!("Failed to add relay: {}", e))?;

    // Connect to the relay
    client.connect().await;

    // Publish the gift-wrapped event
    match client.send_event(&gift_wrap).await {
        Ok(event_id) => {
            // Disconnect from the relay after publishing
            let _ = client.disconnect().await;
            Ok(format!(
                "Successfully shared gift-wrapped event with ID: {:?}",
                event_id
            ))
        }
        Err(e) => {
            // Make sure to disconnect even if publishing fails
            let _ = client.disconnect().await;
            Err(format!("Failed to send gift-wrapped event: {}", e))
        }
    }
}

// Verify if a pubkey is valid
#[tauri::command]
pub fn validate_pubkey(pubkey: String) -> Result<bool, String> {
    match PublicKey::from_hex(&pubkey) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

// Fetch gift wrap events for the current user from a relay
#[tauri::command]
pub async fn fetch_gift_wraps(
    store: State<'_, Arc<DiaryStore>>,
    relay_url: String,
) -> Result<Vec<UnwrappedGiftResponse>, String> {
    // Get the user's keys
    let keys = get_or_create_nostr_keys(&store)?;
    let user_pubkey = keys.public_key();

    println!("Fetching gift wraps for pubkey: {}", user_pubkey);

    // Create client
    let client = ClientBuilder::new().build();

    // Add the relay
    client
        .add_relay(relay_url.clone())
        .await
        .map_err(|e| format!("Failed to add relay: {}", e))?;

    // Connect to the relay
    client.connect().await;

    // Create a filter to find gift wrap events (kind 1059) with p tag matching user's pubkey
    let filter = Filter::new()
        .kind(Kind::GiftWrap)
        .custom_tag(SingleLetterTag::lowercase(Alphabet::P), user_pubkey);

    println!("Subscribing with filter: {:?}", filter);

    // Create a subscription with timeout
    let events = client
        .fetch_events_from(["ws://localhost:8080"], filter, Duration::new(30, 0))
        .await
        .map_err(|e| format!("Failed to fetch events: {}", e))?;

    println!("Received {} events", events.len());

    // Disconnect from the relay
    let _ = client.disconnect().await;

    let events_json_futures = events.into_iter().map(|e| {
        let nostr_signer = &keys;
        async move {
            let unwrapped_gift = UnwrappedGift::from_gift_wrap(nostr_signer, &e)
                .await
                .unwrap();
            let rumor = unwrapped_gift.rumor;
            let sender_pubkey = unwrapped_gift.sender.to_hex();
            UnwrappedGiftResponse {
                sender_pubkey,
                gift_wrap_event: serde_json::to_string(&rumor).unwrap(),
            }
        }
    });

    let events_json: Vec<UnwrappedGiftResponse> = join_all(events_json_futures).await;
    Ok(events_json)
}
