import { useState } from "preact/hooks";
import { shortenKey } from "../utils/helpers";
import { verifyNostrSignature } from "../utils/diaryService";

interface NostrEventViewerProps {
  selectedNostrEvent: string;
  nostrEventData: string;
  closeNostrEventView: () => void;
  isOwnEvent?: boolean;
}

export function NostrEventViewer({
  selectedNostrEvent,
  nostrEventData,
  closeNostrEventView,
  isOwnEvent = true,
}: NostrEventViewerProps) {
  const [verificationResult, setVerificationResult] = useState<{status: 'idle' | 'loading' | 'success' | 'error'; message?: string}>({ status: 'idle' });

  const handleVerifySignature = async () => {
    try {
      setVerificationResult({ status: 'loading' });
      const isValid = await verifyNostrSignature(selectedNostrEvent);
      setVerificationResult({ 
        status: 'success', 
        message: isValid ? "签名有效 ✓" : "签名无效 ✗"
      });
    } catch (error) {
      setVerificationResult({ 
        status: 'error', 
        message: `验证失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#262624] rounded-md shadow-md border border-[#e6dfd3] dark:border-border-dark overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#e6dfd3] dark:border-border-dark bg-[#f9f6f0] dark:bg-[#2a2a28]">
        <h3 className="m-0 text-[16px] text-[#7c6d58] dark:text-text-secondary-dark">Nostr 事件: {selectedNostrEvent.substring(0, 8)}...</h3>
        <div className="flex gap-2">
          {isOwnEvent ? (
            <>
              <button 
                className="bg-[#f0ebe2] dark:bg-[#2a2a28] text-[#7c6d58] dark:text-text-secondary-dark text-sm py-1 px-3 border border-[#d9d0c1] dark:border-border-dark rounded hover:bg-[#e6dfd3] dark:hover:bg-[#333331]" 
                onClick={handleVerifySignature}
                disabled={verificationResult.status === 'loading'}
              >
                {verificationResult.status === 'loading' ? '验证中...' : '验证签名'}
              </button>
            </>
          ) : (
           <></> 
          )}
          <button 
            className="bg-[#f0ebe2] dark:bg-[#2a2a28] text-[#7c6d58] dark:text-text-secondary-dark text-sm py-1 px-3 border border-[#d9d0c1] dark:border-border-dark rounded hover:bg-[#e6dfd3] dark:hover:bg-[#333331]" 
            onClick={closeNostrEventView}
          >
            关闭
          </button>
        </div>
      </div>
      {isOwnEvent && verificationResult.status !== 'idle' && verificationResult.message && (
        <div className={`px-6 py-2 text-sm font-medium ${
          verificationResult.status === 'loading' ? 'bg-[#f9f9d9] dark:bg-[#36362e] text-[#7c7c3a] dark:text-[#d2d28a]' :
          verificationResult.status === 'success' && verificationResult.message.includes('有效') ? 'bg-[#e6f6e8] dark:bg-[#2e392f] text-[#3d7a45] dark:text-[#8cd996]' :
          'bg-[#f9e6e6] dark:bg-[#3a2e2e] text-[#a33a3a] dark:text-[#eb9090]'
        }`}>
          {verificationResult.message}
        </div>
      )}
      {!isOwnEvent && (
        <div className="px-6 py-2 text-sm font-medium bg-[#f9f9d9] dark:bg-[#36362e] text-[#7c7c3a] dark:text-[#d2d28a]">
          朋友的日记无法验证签名，因为使用了更强调隐私性的 <a href="https://github.com/nostr-protocol/nips/blob/master/59.md" target="_blank" rel="noopener noreferrer">Nip59 GiftWrap 模式分享</a>。
        </div>
      )}
      <div className="w-full max-h-[70vh] overflow-y-auto bg-[#f8f9fa] dark:bg-[#2a2a28] p-4 rounded text-sm whitespace-pre-wrap break-words">
        {(() => {
          try {
            const event = JSON.parse(nostrEventData);
            return (
              <>
                <div className="mb-6 pb-4 border-b border-[#e0e0e0] dark:border-border-dark">
                  <p><strong>类型:</strong> {event.kind === 30027 ? "鲁迅日记格式 (30027)" : event.kind}</p>
                  <p><strong>创建时间:</strong> {new Date(event.created_at * 1000).toLocaleString('zh-CN')}</p>
                  <p><strong>公钥:</strong> {shortenKey(event.pubkey)}</p>
                  <p><strong>签名:</strong> <span className="font-mono text-xs">{shortenKey(event.sig) ? shortenKey(event.sig) : '无'}</span></p>
                </div>
                
                <div className="mb-6 pb-4 border-b border-[#e0e0e0] dark:border-border-dark">
                  <h4 className="font-medium mb-2">标签:</h4>
                  <ul className="list-none pl-2">
                    {event.tags.map((tag: any, index: number) => (
                      <li key={index} className="py-1">
                        <strong>{tag[0]}:</strong> {tag[1]}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6 pb-4 border-b border-[#e0e0e0] dark:border-border-dark">
                  <h4 className="font-medium mb-2">内容:</h4>
                  <pre className="bg-white dark:bg-[#262624] p-4 rounded border border-[#e0e0e0] dark:border-border-dark">{event.content}</pre>
                </div>
                
                <details className="cursor-pointer">
                  <summary className="font-bold mb-2 text-[#555] dark:text-text-secondary-dark">原始 JSON</summary>
                  <pre className="bg-[#f0f0f0] dark:bg-[#262624] p-3 rounded text-xs">{JSON.stringify(event, null, 2)}</pre>
                </details>
              </>
            );
          } catch (e) {
            return <pre>{nostrEventData}</pre>;
          }
        })()}
      </div>
    </div>
  );
} 
