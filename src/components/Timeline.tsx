import { DiaryEntry } from "../types";
import { formatDate, formatShortDate, groupEntriesByYear, shortenKey } from "../utils/helpers";

interface TimelineProps {
  entries: DiaryEntry[];
  viewNostrEvent: (nostrId: string) => void;
}

export function Timeline({ entries, viewNostrEvent }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-center py-10 px-8 text-[#8c7c67] dark:text-[#a6a69e] italic bg-[#f9f6f0] dark:bg-[#2a2a28] rounded-lg border border-dashed border-[#d9d0c1] dark:border-border-dark w-full max-w-2xl">
          暂无日记。开始写下您的第一篇日记吧！
        </p>
      </div>
    );
  }

  return (
    <div className="relative py-10">
      <div className="absolute top-0 bottom-0 left-[15%] w-[2px] bg-gradient-to-b from-[#d8d3c5] via-[#c0bfb8] to-[#d8d3c5] dark:from-[#444442] dark:via-[#555553] dark:to-[#444442] transform -translate-x-1/2"></div>
      
      {Object.entries(groupEntriesByYear(entries))
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .map(([year, yearEntries]) => (
        <div key={year} className="relative mb-12 last:mb-0">
          <div className="relative mb-8 text-left pl-[15%] transform -translate-x-1/2 z-10 flex items-center">
            <span className="inline-block bg-gradient-to-r from-accent-dark to-[#4e998e] dark:from-accent-dark dark:to-[#247a6d] text-white text-lg font-medium py-1.5 px-6 rounded-full shadow-sm z-10 text-center min-w-[90px]">
              {year}年
            </span>
          </div>
          {yearEntries.map((entry) => (
            <div key={entry.id} className="relative flex mb-10 last:mb-0">
              <div className="relative w-[15%] pr-6 text-right">
                <div className="absolute top-3 right-[-6px] w-3 h-3 bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] rounded-full transform translate-x-1/2 z-10 shadow-sm"></div>
                
              </div>
              <div className="flex-1 bg-white dark:bg-[#1a1a1e] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-[#e9e4d9] dark:border-[#2c2c32] p-6 ml-6">
                <div className="flex items-center pb-3 mb-4 border-b border-[#f0ede4] dark:border-[#2a2a30] text-sm text-[#8c8b85] dark:text-[#7fb5ae]">
                  <div className="flex items-center">
                    <span className="text-[#5d5a4c] dark:text-[#a2e2d8] font-medium mr-5">
                    <span className="ml-1 text-[#7a7666] dark:text-[#8fc9c3]">
                    {formatShortDate(entry.day)}</span>
                    </span>
                    <span className="text-[#5d5a4c] dark:text-[#a2e2d8] font-medium mr-5">
                      <span className="ml-1 text-[#7a7666] dark:text-[#8fc9c3]">{entry.weather}</span>
                    </span>
                    <span className="text-[#9c9b95] dark:text-[#717b7a] text-xs mr-4">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  {entry.nostr_id && (
                    <span className="text-[#9c9b95] dark:text-[#717b7a] text-xs ml-auto flex items-center">
                      Nostr: {shortenKey(entry.nostr_id)}
                      <button 
                        className="ml-2 bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] text-xs py-1 px-3 border border-[#e6e1d5] dark:border-[#323237] rounded-full hover:bg-[#f0ede6] dark:hover:bg-[#2a2a32] transition-colors"
                        onClick={() => viewNostrEvent(entry.nostr_id as string)}
                      >
                        查看
                      </button>
                    </span>
                  )}
                </div>
                <div className="text-[#2c2c2a] dark:text-[#e9e9e7] leading-7 font-normal">
                  {entry.content.split("\n").map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">{line}</p>
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
