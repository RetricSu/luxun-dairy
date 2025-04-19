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
    <div className="nostr-event-view">
      <div className="nostr-event-header">
        <h3>Nostr 事件: {selectedNostrEvent.substring(0, 8)}...</h3>
        <button className="close-button" onClick={closeNostrEventView}>关闭</button>
      </div>
      <div className="nostr-event-content">
        {(() => {
          try {
            const event = JSON.parse(nostrEventData);
            return (
              <>
                <div className="nostr-event-meta">
                  <p><strong>类型:</strong> {event.kind === 30027 ? "鲁迅日记格式 (30027)" : event.kind}</p>
                  <p><strong>创建时间:</strong> {new Date(event.created_at * 1000).toLocaleString('zh-CN')}</p>
                  <p><strong>公钥:</strong> {shortenKey(event.pubkey)}</p>
                </div>
                
                <div className="nostr-event-tags">
                  <h4>标签:</h4>
                  <ul>
                    {event.tags.map((tag: any, index: number) => (
                      <li key={index}>
                        <strong>{tag[0]}:</strong> {tag[1]}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="nostr-event-content-text">
                  <h4>内容:</h4>
                  <pre>{event.content}</pre>
                </div>
                
                <details>
                  <summary>原始 JSON</summary>
                  <pre>{JSON.stringify(event, null, 2)}</pre>
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
