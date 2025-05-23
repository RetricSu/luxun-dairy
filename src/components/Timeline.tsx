import { useState } from "preact/hooks";
import { DiaryEntry } from "../types";
import { formatShortDate, groupEntriesByYear, shortenKey } from "../utils/helpers";
import GiftWrapShare from "./GiftWrapShare";

interface TimelineProps {
  entries: DiaryEntry[];
  viewNostrEvent: (nostrId: string) => void;
}

export function Timeline({ entries, viewNostrEvent }: TimelineProps) {
  const [isGiftWrapOpen, setIsGiftWrapOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const handleGiftWrapOpen = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsGiftWrapOpen(true);
  };

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-center py-8 px-6 text-[#8c7c67] dark:text-[#a6a69e] italic bg-[#f9f6f0] dark:bg-[#2a2a28] rounded-lg border border-dashed border-[#d9d0c1] dark:border-border-dark w-full max-w-2xl">
          暂无日记。开始写下您的第一篇日记吧！
        </p>
      </div>
    );
  }

  return (
    <div className="relative py-8">
      <div className="absolute top-0 bottom-0 left-[15%] w-[2px] bg-gradient-to-b from-[#d8d3c5] via-[#c0bfb8] to-[#d8d3c5] dark:from-[#444442] dark:via-[#555553] dark:to-[#444442] transform -translate-x-1/2"></div>
      
      {Object.entries(groupEntriesByYear(entries))
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .map(([year, yearEntries]) => (
        <div key={year} className="relative mb-10 last:mb-0">
          <span className="inline-block bg-gradient-to-r from-accent-dark to-[#4e998e] dark:from-accent-dark dark:to-[#247a6d] text-white text-lg font-medium py-1 px-5 rounded shadow-sm z-10 text-center min-w-[80px]">
              {year}年
            </span>
          {yearEntries.map((entry) => (
            <div 
              key={entry.id} 
              id={`entry-${entry.day}`} 
              className="relative flex mb-8 last:mb-0 transition-all duration-300"
            >
              <div className="relative w-[15%] pr-6 text-right">
                <div className="absolute top-3 right-[-6px] w-3 h-3 bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] rounded-full transform translate-x-1/2 z-10"></div>
              </div>
              <div className="flex-1 bg-white dark:bg-[#1a1a1e] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-[#e9e4d9] dark:border-[#2c2c32] p-5 ml-6">
                <div className="flex items-center pb-2 mb-3 border-b border-[#f0ede4] dark:border-[#2a2a30] text-sm">
                  <span className="text-[#49818b] dark:text-[#49818b] font-medium mr-3">{formatShortDate(entry.day)}</span>
                  <span className="text-[#718328] dark:text-[#d0e57e] font-medium">{entry.weather}</span>
                  {entry.nostr_id && (
                    <span className="text-[#9c9b95] dark:text-[#717b7a] text-xs ml-auto flex items-center">
                      <span className="hidden sm:inline">Nostr: {shortenKey(entry.nostr_id)}</span>
                      <button 
                        className="ml-2 bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] text-xs py-0.5 px-2 border border-[#e6e1d5] dark:border-[#323237] rounded-full hover:bg-[#f0ede6] dark:hover:bg-[#2a2a32] transition-colors"
                        onClick={() => viewNostrEvent(entry.nostr_id as string)}
                      >
                        查看
                      </button>
                      <button 
                        className="ml-1 bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] text-xs py-0.5 px-2 border border-[#e6e1d5] dark:border-[#323237] rounded-full hover:bg-[#f0ede6] dark:hover:bg-[#2a2a32] transition-colors"
                        onClick={() => handleGiftWrapOpen(entry)}
                      >
                        加密分享
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
      
      {/* Gift Wrap Modal */}
      {selectedEntry && (
        <GiftWrapShare
          entry={selectedEntry}
          isOpen={isGiftWrapOpen}
          onClose={() => setIsGiftWrapOpen(false)}
        />
      )}
    </div>
  );
} 
