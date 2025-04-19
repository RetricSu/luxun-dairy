import { DiaryEntry } from "../types";
import { formatDate, formatShortDate, groupEntriesByYear, shortenKey } from "../utils/helpers";

interface TimelineProps {
  entries: DiaryEntry[];
  viewNostrEvent: (nostrId: string) => void;
}

export function Timeline({ entries, viewNostrEvent }: TimelineProps) {
  if (entries.length === 0) {
    return <p className="no-entries">暂无日记。开始写下您的第一篇日记吧！</p>;
  }

  return (
    <div className="timeline-container">
      <div className="timeline-line"></div>
      {Object.entries(groupEntriesByYear(entries))
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))  // 按年份倒序排列
        .map(([year, yearEntries]) => (
        <div key={year} className="timeline-year-group">
          <span className="timeline-year">{year}年</span>
          {yearEntries.map((entry) => (
            <div key={entry.id} className="timeline-entry">
              <div className="timeline-marker">
                <div className="timeline-dot"></div>
                <div className="timeline-date">{formatShortDate(entry.day)}</div>
              </div>
              <div className="entry-card">
                <div className="entry-header">
                  <span className="entry-weather">天气: {entry.weather}</span>
                  <span className="entry-time">{formatDate(entry.created_at)}</span>
                  {entry.nostr_id && (
                    <span className="entry-nostr-id">
                      Nostr: {shortenKey(entry.nostr_id)}
                      <button 
                        className="view-nostr-button"
                        onClick={() => viewNostrEvent(entry.nostr_id as string)}
                      >
                        查看
                      </button>
                    </span>
                  )}
                </div>
                <div className="entry-content">
                  {entry.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 
