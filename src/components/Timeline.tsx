import { DiaryEntry } from "../types";
import { formatDate, formatShortDate, groupEntriesByYear, shortenKey } from "../utils/helpers";

interface TimelineProps {
  entries: DiaryEntry[];
  viewNostrEvent: (nostrId: string) => void;
}

export function Timeline({ entries, viewNostrEvent }: TimelineProps) {
  if (entries.length === 0) {
    return <p className="text-center py-12 px-8 text-[#8c7c67] dark:text-[#a6a69e] italic bg-[#f9f6f0] dark:bg-[#2a2a28] rounded-md border border-dashed border-[#d9d0c1] dark:border-border-dark">暂无日记。开始写下您的第一篇日记吧！</p>;
  }

  return (
    <div className="relative py-8">
      <div className="absolute top-0 bottom-0 left-[20%] w-px bg-[#c0bfb8] dark:bg-[#444442] transform -translate-x-1/2"></div>
      {Object.entries(groupEntriesByYear(entries))
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))  // 按年份倒序排列
        .map(([year, yearEntries]) => (
        <div key={year} className="relative mb-10 last:mb-0">
          <div className="relative mb-8 text-left pl-[20%] transform -translate-x-1/2 z-10 flex items-center">
            <span className="inline-block bg-accent-dark dark:bg-accent-dark dark:opacity-95 text-white text-lg font-semibold py-1.5 px-5 rounded-3xl shadow-md z-10 text-center min-w-[80px]">{year}年</span>
          </div>
          {yearEntries.map((entry) => (
            <div key={entry.id} className="relative flex mb-8 last:mb-0">
              <div className="relative w-[20%] pr-6 text-right">
                <div className="absolute top-3 right-[-5px] w-2.5 h-2.5 bg-accent-dark dark:bg-accent-dark rounded-full transform translate-x-1/2 z-10"></div>
                <div className="text-sm text-[#5f5e56] dark:text-[#bfbfb3] font-medium mt-1 mr-3">{formatShortDate(entry.day)}</div>
              </div>
              <div className="flex-1 bg-white dark:bg-[#262624] rounded-md shadow-sm border border-border-light dark:border-border-dark p-5 ml-6">
                <div className="flex items-center pb-3 mb-4 border-b border-dashed border-border-light dark:border-border-dark text-sm text-[#8c8b85] dark:text-[#a6a69e]">
                  <span className="text-[#6d6a5c] dark:text-[#bfbfb3] font-medium mr-4">天气: {entry.weather}</span>
                  <span className="text-[#8c8b85] dark:text-[#a6a69e] text-xs mr-4">{formatDate(entry.created_at)}</span>
                  {entry.nostr_id && (
                    <span className="text-[#8c8b85] dark:text-[#a6a69e] text-xs ml-auto flex items-center">
                      Nostr: {shortenKey(entry.nostr_id)}
                      <button 
                        className="bg-[#f0f0eb] dark:bg-[#2a2a28] text-[#6d6a5c] dark:text-[#bfbfb3] text-xs py-0.5 px-2 border border-border-light dark:border-border-dark rounded hover:bg-[#e8e8e3] dark:hover:bg-[#333331] ml-2"
                        onClick={() => viewNostrEvent(entry.nostr_id as string)}
                      >
                        查看
                      </button>
                    </span>
                  )}
                </div>
                <div className="text-text-primary dark:text-text-primary-dark leading-7">
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
