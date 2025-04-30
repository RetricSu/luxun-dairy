import { useState, useEffect } from "preact/hooks";
import { formatDayDisplay } from "../utils/helpers";
import { getRandomLuXunDiaryEntry } from "../utils/diaryService";
import { LuXunDiaryEntry } from "../types";

interface CompletedEntryProps {
  selectedDay: string;
}

export function CompletedEntry({ selectedDay }: CompletedEntryProps) {
  const [luxunDiary, setLuxunDiary] = useState<LuXunDiaryEntry | null>(null);

  const fetchLuXunDiary = async () => {
    try {
      const entry = await getRandomLuXunDiaryEntry();
      setLuxunDiary(entry);
    } catch (error) {
      console.error("Failed to fetch Lu Xun diary entry:", error);
    }
  };

  useEffect(() => {
    fetchLuXunDiary();
  }, []);

  // 格式化日期为中文年月
  const formatLuxunDate = (dateString: string) => {
    try {
      const dateParts = dateString.split("-");
      const year = dateParts[0];
      const month = dateParts[1].replace(/^0+/, ''); // 移除前导零
      const day = dateParts[2].replace(/^0+/, ''); // 移除前导零
      return `${year}年${month}月${day}日`;
    } catch (e: any) {
      return dateString;
    }
  };

  return (
    <div className="py-14 text-center bg-white dark:bg-[#222226] rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32] shadow-sm">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white text-2xl shadow-sm mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h3 className="m-0 mb-4 text-2xl text-[#3c7d73] dark:text-[#a2e2d8] font-medium">已完成</h3>
      <p className="text-[#6d7a75] dark:text-[#a6a69e] text-lg m-0 leading-relaxed max-w-lg mx-auto">您已记录 {formatDayDisplay(selectedDay)} 之事。</p>
      <p className="text-[#6d7a75] dark:text-[#a6a69e] text-sm mt-6 mb-2">
        为您随机展示一篇鲁迅先生的日记
      </p>
      
      <div className="mt-12 max-w-lg mx-auto">
        <div className="p-5 border border-[#e9e4d9] dark:border-[#2c2c32] rounded-lg bg-[#fafaf8] dark:bg-[#1d1d20]">
          {!luxunDiary ? (
            <div className="py-8 text-center text-[#6d7a75] dark:text-[#a6a69e]">
              无法加载日记，请稍后再试
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#3c7d73] dark:text-[#a2e2d8] font-medium">鲁迅 {formatLuxunDate(luxunDiary.date)}</span>
                <button 
                  onClick={fetchLuXunDiary}
                  className="flex items-center justify-center px-3 py-1 text-xs text-[#6d7a75] dark:text-[#a6a69e] rounded bg-[#f5f5f0] dark:bg-[#2a2a2e] hover:bg-[#e9e9e4] dark:hover:bg-[#323236] text-[#4d5a55] dark:text-[#b6b6be] transition-colors duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M23 4v6h-6"></path>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  换一条
                </button>
              </div>
              <p className="text-[#4d5a55] dark:text-[#b6b6be] text-base leading-relaxed m-0 text-left whitespace-pre-line">{luxunDiary.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
