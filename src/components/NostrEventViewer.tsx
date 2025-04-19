import { shortenKey } from "../utils/helpers";

interface NostrEventViewerProps {
  selectedNostrEvent: string;
  nostrEventData: string;
  closeNostrEventView: () => void;
}

export function NostrEventViewer({
  selectedNostrEvent,
  nostrEventData,
  closeNostrEventView,
}: NostrEventViewerProps) {
  return (
    <div className="bg-white dark:bg-[#262624] rounded-md shadow-md border border-[#e6dfd3] dark:border-border-dark overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#e6dfd3] dark:border-border-dark bg-[#f9f6f0] dark:bg-[#2a2a28]">
        <h3 className="m-0 text-[16px] text-[#7c6d58] dark:text-text-secondary-dark">Nostr 事件: {selectedNostrEvent.substring(0, 8)}...</h3>
        <button 
          className="bg-[#f0ebe2] dark:bg-[#2a2a28] text-[#7c6d58] dark:text-text-secondary-dark text-sm py-1 px-3 border border-[#d9d0c1] dark:border-border-dark rounded hover:bg-[#e6dfd3] dark:hover:bg-[#333331]" 
          onClick={closeNostrEventView}
        >
          关闭
        </button>
      </div>
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
