import { invoke } from '@tauri-apps/api/core';
import { useState } from 'preact/hooks';
import { DiaryEntry } from '../types/DiaryEntry';
import {Modal} from './Modal';
import { JSX } from 'preact';

interface GiftWrapShareProps {
  entry: DiaryEntry | null;
  onClose: () => void;
  isOpen: boolean;
}

export function GiftWrapShare({ entry, onClose, isOpen }: GiftWrapShareProps) {
  const [recipientPubkey, setRecipientPubkey] = useState('');
  const [isWrapping, setIsWrapping] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [giftWrapData, setGiftWrapData] = useState<{ event: string; id: string } | null>(null);
  const [relayUrl, setRelayUrl] = useState('ws://localhost:8080');

  // Reset form when closed
  const handleClose = () => {
    setRecipientPubkey('');
    setError(null);
    setSuccess(null);
    setGiftWrapData(null);
    setIsWrapping(false);
    setIsSharing(false);
    onClose();
  };

  // Validate pubkey format
  const validatePubkey = async (pubkey: string): Promise<boolean> => {
    try {
      const isValid = await invoke<boolean>('validate_pubkey', { pubkey });
      return isValid;
    } catch (err) {
      console.error('Failed to validate pubkey:', err);
      return false;
    }
  };

  // Create gift wrap
  const handleGiftWrap = async () => {
    setError(null);
    setSuccess(null);
    
    if (!entry?.nostr_id) {
      setError('No diary entry selected');
      return;
    }
    
    // Validate pubkey format
    const pubkeyValid = await validatePubkey(recipientPubkey);
    if (!pubkeyValid) {
      setError('Invalid recipient public key. Please enter a valid Nostr hex public key.');
      return;
    }
    
    setIsWrapping(true);
    
    try {
      const result = await invoke<{ gift_wrap_event: string, gift_wrap_id: string }>('gift_wrap_diary', {
        request: {
          nostr_id: entry.nostr_id,
          recipient_pubkey: recipientPubkey,
        }
      });
      
      setGiftWrapData({
        event: result.gift_wrap_event,
        id: result.gift_wrap_id
      });
      
      setSuccess('Diary entry gift-wrapped successfully! You can now share it.');
    } catch (err) {
      console.error('Failed to gift wrap diary:', err);
      setError(`Failed to gift wrap: ${err}`);
    } finally {
      setIsWrapping(false);
    }
  };

  // Share the gift wrap to a relay
  const handleShare = async () => {
    if (!giftWrapData) {
      setError('No gift-wrapped data to share');
      return;
    }
    
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await invoke<string>('share_gift_wrap', {
        giftWrapJson: giftWrapData.event,
        relayUrl,
      });
      
      setSuccess(result);
    } catch (err) {
      console.error('Failed to share gift wrap:', err);
      setError(`Failed to share: ${err}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-4 bg-white">
        <h2 className="text-xl font-semibold mb-4">Gift Wrap & Share Diary</h2>
        {!entry?.nostr_id ? (
          <div className="text-red-500 mb-4">Please select a diary entry to share.</div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Gift wrapping allows you to privately share your diary entry with a friend
                using Nostr's encryption. Only the recipient will be able to see the content.
              </p>
              
              <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-1">{entry.day}</h3>
                <p className="text-sm text-gray-600">Weather: {entry.weather}</p>
                <p className="whitespace-pre-wrap mt-2">{entry.content.substring(0, 100)}...</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient's Public Key (hex format)
              </label>
              <input
                type="text"
                value={recipientPubkey}
                onChange={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => setRecipientPubkey(e.currentTarget.value)}
                disabled={isWrapping || !!giftWrapData}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter recipient's Nostr public key (hex format)"
              />
            </div>

            {!giftWrapData ? (
              <button
                onClick={handleGiftWrap}
                disabled={isWrapping || !recipientPubkey}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isWrapping ? 'Creating Gift Wrap...' : 'Create Gift Wrap'}
              </button>
            ) : (
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relay URL
                  </label>
                  <input
                    type="text"
                    value={relayUrl}
                    onChange={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => setRelayUrl(e.currentTarget.value)}
                    disabled={isSharing}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="ws://localhost:8080"
                  />
                </div>
                
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSharing ? 'Sharing...' : 'Share to Relay'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                {success}
              </div>
            )}

            {giftWrapData && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Gift Wrap ID:</p>
                <p className="text-xs break-all bg-gray-100 p-2 rounded-md">{giftWrapData.id}</p>
                <div className="mt-4">
                  <details className="bg-gray-100 rounded-md">
                    <summary className="text-sm font-medium text-gray-700 p-2 cursor-pointer hover:bg-gray-200">
                      Show Raw Gift Wrap Event
                    </summary>
                    <pre className="text-xs p-2 overflow-x-auto">
                      {JSON.stringify(JSON.parse(giftWrapData.event), null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default GiftWrapShare; 
