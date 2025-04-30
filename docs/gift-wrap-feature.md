# Gift Wrap Feature Documentation

## Overview

The Gift Wrap feature in Luxun Dairy enables users to privately share specific diary entries with other Nostr users. This feature utilizes NIP-59's Gift Wrap protocol to create encrypted messages that can only be read by the intended recipient.

## How Gift Wrap Works

1. **Encryption**: The diary entry is encrypted specifically for the recipient's public key.
2. **Obfuscation**: A random timestamp (up to 2 days in the past) is used to prevent correlation attacks.
3. **Private Delivery**: The gift-wrapped entry is sent directly to the recipient via Nostr relays.

## Technical Details

### Event Types

- The gift-wrapped event uses Kind `30027` which is designated for our diary entries
- The gift wrap uses NIP-59's protocol to ensure only the recipient can decrypt the content

### Privacy Measures

- Original entry timestamp is replaced with a random timestamp
- The sender's identity is preserved but the content is encrypted
- Only the recipient with the matching private key can decrypt the content

### Implementation

The feature consists of two main components:

1. **Gift Wrap Creation**: Creates an encrypted version of a diary entry specifically for a recipient
2. **Gift Wrap Sharing**: Publishes the encrypted event to Nostr relays

## User Flow

1. User selects a diary entry to share
2. User enters the recipient's Nostr public key
3. The system validates the public key format
4. The entry is encrypted (gift-wrapped) for the recipient
5. User can then share the gift-wrapped entry through Nostr relays

## API Reference

### Gift Wrap Creation

```rust
#[tauri::command]
pub async fn gift_wrap_diary(
    store: State<'_, Arc<DiaryStore>>,
    request: GiftWrapRequest,
) -> Result<GiftWrapResponse, String>
```

#### Parameters:
- `GiftWrapRequest` containing:
  - `nostr_id`: ID of the diary entry to share
  - `recipient_pubkey`: Nostr public key of the recipient

#### Returns:
- `GiftWrapResponse` containing:
  - `gift_wrap_event`: The encrypted event as JSON
  - `gift_wrap_id`: The ID of the gift-wrapped event

### Gift Wrap Sharing

```rust
#[tauri::command]
pub async fn share_gift_wrap(
    gift_wrap_json: String,
    relay_url: String,
) -> Result<String, String>
```

#### Parameters:
- `gift_wrap_json`: The JSON representation of the gift-wrapped event
- `relay_url`: The URL of the Nostr relay to publish to

#### Returns:
- A success message with the event ID when successful
- An error message if sharing fails

## Security Considerations

- The gift wrap feature uses public key cryptography to ensure only the intended recipient can read the shared diary entry
- Random timestamps help prevent correlation of the original diary entry with the shared version
- No plaintext content is exposed in the transmission process

## Future Enhancements

- Support for multiple recipients
- Read receipts for shared entries
- Ability to revoke shared entries
- UI enhancements for tracking shared entries 
