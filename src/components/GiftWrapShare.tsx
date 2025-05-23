import { invoke } from '@tauri-apps/api/core';
import { useState } from 'preact/hooks';
import { DiaryEntry } from '../types/DiaryEntry';
import {Modal} from './Modal';
import { JSX } from 'preact';
import { useRelayUrls } from '../hooks/useRelayUrls';

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
  const { relayUrls, isLoading: isLoadingRelays, error: relayError } = useRelayUrls();
  const [selectedRelayUrl, setSelectedRelayUrl] = useState<string>('');

  // Reset form when closed
  const handleClose = () => {
    setRecipientPubkey('');
    setError(null);
    setSuccess(null);
    setGiftWrapData(null);
    setIsWrapping(false);
    setIsSharing(false);
    setSelectedRelayUrl('');
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
      setError('请先选择要分享的日记');
      return;
    }
    
    // Validate pubkey format
    const pubkeyValid = await validatePubkey(recipientPubkey);
    if (!pubkeyValid) {
      setError('接收者公钥格式无效，请输入有效的Nostr十六进制公钥');
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
      
      setSuccess('日记已成功加密分享！现在可以分享了。');
    } catch (err) {
      console.error('Failed to gift wrap diary:', err);
      setError(`加密分享失败: ${err}`);
    } finally {
      setIsWrapping(false);
    }
  };

  // Share the gift wrap to a relay
  const handleShare = async () => {
    if (!giftWrapData) {
      setError('没有可分享的加密分享数据');
      return;
    }

    if (!selectedRelayUrl) {
      setError('请选择一个中继服务器');
      return;
    }
    
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await invoke<string>('share_gift_wrap', {
        giftWrapJson: giftWrapData.event,
        relayUrl: selectedRelayUrl,
      });
      
      setSuccess(result);
    } catch (err) {
      console.error('Failed to share gift wrap:', err);
      setError(`分享失败: ${err}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-2xl">
      <div className="p-6 bg-white rounded-lg shadow-lg relative w-full max-h-[80vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="关闭"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 pr-8">加密分享日记</h2>
        {!entry?.nostr_id ? (
          <div className="text-red-500 mb-4 text-center">请先选择要分享的日记</div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-700 mb-4 leading-relaxed">
                加密分享功能允许您使用 Nostr 协议与朋友私密分享日记。只有接收者才能查看内容。
              </p>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">{entry.day}</h3>
                <p className="text-sm text-gray-600 mb-2">天气: {entry.weather}</p>
                <p className="whitespace-pre-wrap mt-2 text-gray-700 break-words">{entry.content.substring(0, 100)}...</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                接收者公钥（十六进制格式）
              </label>
              <input
                type="text"
                value={recipientPubkey}
                onChange={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => setRecipientPubkey(e.currentTarget.value)}
                disabled={isWrapping || !!giftWrapData}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 break-all"
                placeholder="输入接收者的 Nostr 公钥（十六进制格式）"
              />
            </div>

            {!giftWrapData ? (
              <button
                onClick={handleGiftWrap}
                disabled={isWrapping || !recipientPubkey}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200"
              >
                {isWrapping ? '正在创建...' : '创建加密分享'}
              </button>
            ) : (
              <div className="mt-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    中继服务器地址
                  </label>
                  {isLoadingRelays ? (
                    <div className="text-sm text-gray-500">加载中...</div>
                  ) : relayError ? (
                    <div className="text-sm text-red-500">{relayError}</div>
                  ) : (
                    <select
                      value={selectedRelayUrl}
                      onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) => setSelectedRelayUrl(e.currentTarget.value)}
                      disabled={isSharing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">选择中继服务器</option>
                      {relayUrls.map((url) => (
                        <option key={url} value={url}>
                          {url}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <button
                  onClick={handleShare}
                  disabled={isSharing || !selectedRelayUrl}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
                >
                  {isSharing ? '正在分享...' : '分享到中继服务器'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                {success}
              </div>
            )}

            {giftWrapData && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">加密分享ID：</p>
                  <p className="text-xs break-all font-mono">{giftWrapData.id}</p>
                </div>
                
                <details className="bg-gray-50 rounded-lg border border-gray-200">
                  <summary className="text-sm font-medium text-gray-700 p-3 cursor-pointer hover:bg-gray-100">
                    显示原始加密分享数据
                  </summary>
                  <div className="p-3 bg-white rounded-b-lg">
                    <pre className="text-xs overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(JSON.parse(giftWrapData.event), null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default GiftWrapShare; 
