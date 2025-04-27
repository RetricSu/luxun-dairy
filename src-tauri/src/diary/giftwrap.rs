use crate::diary::store::DiaryStore;
use crate::error::LuxunError;
use nostr_sdk::{
    nips::nip59::{create_gift_wrap_event, get_gift_wrap_data},
    Event, EventBuilder, Keys, Kind, Tag,
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::{sync::Arc, time::{Duration, SystemTime, UNIX_EPOCH}};
use tauri::State;
use tracing::{debug, error, info};

/// Request to gift wrap a diary entry
#[derive(Debug, Deserialize)]
pub struct GiftWrapRequest {
    /// Nostr ID of the diary entry to share
    pub nostr_id: String,
    /// Nostr public key of the recipient (hex format)
    pub recipient_pubkey: String,
}

/// Response containing the gift-wrapped event
#[derive(Debug, Serialize)]
pub struct GiftWrapResponse {
    /// The gift-wrapped event as JSON
    pub gift_wrap_event: String,
    /// The ID of the gift-wrapped event
    pub gift_wrap_id: String,
}

/// Creates a gift-wrapped version of a diary entry for a specific recipient
#[tauri::command]
pub async fn gift_wrap_diary(
    store: State<'_, Arc<DiaryStore>>,
    request: GiftWrapRequest,
) -> Result<GiftWrapResponse, String> {
    // Validate the recipient's public key
    let recipient_key = match nostr_sdk::PublicKey::from_hex(&request.recipient_pubkey) {
        Ok(key) => key,
        Err(e) => {
            error!("Invalid recipient public key: {}", e);
            return Err(format!("Invalid recipient public key: {}", e));
        }
    };

    // Get the original diary entry
    let original_event = match store.get_entry(&request.nostr_id).await {
        Ok(Some(entry)) => entry,
        Ok(None) => return Err(format!("Diary entry not found: {}", request.nostr_id)),
        Err(e) => return Err(format!("Failed to retrieve diary entry: {}", e)),
    };

    // Get the sender's keys
    let sender_keys = match store.keys().await {
        Ok(keys) => keys,
        Err(e) => return Err(format!("Failed to get sender keys: {}", e)),
    };

    // Create a randomized timestamp (up to 2 days in the past) for privacy
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Time error: {}", e))?
        .as_secs();
    
    let random_offset = rand::thread_rng().gen_range(0..172800); // Random time up to 2 days in seconds
    let randomized_timestamp = now - random_offset;

    // Build a new diary event with the same content but randomized timestamp
    let diary_event = EventBuilder::new(
        Kind::Custom(30027), // Diary entry kind
        &original_event.content,
        vec![
            // Keep relevant tags from original entry but modify as needed
            Tag::from(vec!["title", &get_tag_value(&original_event, "title").unwrap_or_default()]),
            Tag::from(vec!["d", &original_event.id.to_hex()]), // Reference to original entry
            // Add other tags as needed
        ],
    )
    .to_event(&sender_keys, Some(randomized_timestamp))
    .map_err(|e| format!("Failed to create diary event: {}", e))?;

    // Create the gift wrap event
    let gift_wrap = create_gift_wrap_event(&sender_keys, &recipient_key, &diary_event)
        .map_err(|e| format!("Failed to create gift wrap: {}", e))?;

    // Serialize the gift wrap event to JSON
    let gift_wrap_json = serde_json::to_string(&gift_wrap)
        .map_err(|e| format!("Failed to serialize gift wrap: {}", e))?;

    info!("Created gift wrap with ID: {}", gift_wrap.id);
    
    Ok(GiftWrapResponse {
        gift_wrap_event: gift_wrap_json,
        gift_wrap_id: gift_wrap.id.to_hex(),
    })
}

/// Sends a gift-wrapped diary entry to a Nostr relay
#[tauri::command]
pub async fn share_gift_wrap(
    gift_wrap_json: String,
    relay_url: String,
) -> Result<String, String> {
    // Parse the gift wrap event from JSON
    let gift_wrap: Event = serde_json::from_str(&gift_wrap_json)
        .map_err(|e| format!("Failed to parse gift wrap JSON: {}", e))?;

    // Create a client for sending to the relay
    let mut client = nostr_sdk::Client::new(&nostr_sdk::Keys::generate());
    
    // Add the relay
    client.add_relay(relay_url.clone())
        .await
        .map_err(|e| format!("Failed to add relay: {}", e))?;
    
    // Connect to the relay
    client.connect().await;
    
    // Send the gift wrap event
    let event_id = match client.send_event(gift_wrap).await {
        Ok(id) => id,
        Err(e) => {
            client.disconnect().await;
            return Err(format!("Failed to send gift wrap: {}", e));
        }
    };
    
    // Disconnect from the relay
    client.disconnect().await;
    
    info!("Shared gift wrap with ID {} to relay {}", event_id, relay_url);
    
    Ok(format!("Successfully shared gift wrap with ID: {}", event_id))
}

/// Helper function to get a tag value from an event
fn get_tag_value(event: &Event, name: &str) -> Option<String> {
    event.tags.iter()
        .find(|tag| tag.as_vec().get(0).map(|v| v == name).unwrap_or(false))
        .and_then(|tag| tag.as_vec().get(1).cloned())
}

#[cfg(test)]
mod tests {
    use super::*;
    use nostr_sdk::{prelude::*, EventId};
    
    #[test]
    fn test_gift_wrap_unwrap() {
        let sender_keys = Keys::generate();
        let recipient_keys = Keys::generate();
        
        // Create a test diary entry
        let content = "This is a test diary entry";
        let original_event = EventBuilder::new(
            Kind::Custom(30027),
            content,
            vec![Tag::from(vec!["title", "Test Entry"])],
        )
        .to_event(&sender_keys, None)
        .unwrap();
        
        // Create gift wrap
        let gift_wrap = create_gift_wrap_event(
            &sender_keys,
            &recipient_keys.public_key(),
            &original_event,
        )
        .unwrap();
        
        // Recipient unwraps the gift
        let unwrapped = get_gift_wrap_data(&recipient_keys, &gift_wrap).unwrap();
        
        // Verify the content matches
        assert_eq!(unwrapped.content, content);
    }
} 
