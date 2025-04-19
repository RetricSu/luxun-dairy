import { formatDayDisplay } from "../utils/helpers";

interface CompletedEntryProps {
  selectedDay: string;
}

export function CompletedEntry({ selectedDay }: CompletedEntryProps) {
  return (
    <div className="py-14 text-center bg-white dark:bg-[#222226] rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32] shadow-sm">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white text-2xl shadow-sm mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h3 className="m-0 mb-4 text-2xl text-[#3c7d73] dark:text-[#a2e2d8] font-medium">已完成</h3>
      <p className="text-[#6d7a75] dark:text-[#a6a69e] text-lg m-0 leading-relaxed max-w-lg mx-auto">您已记录 {formatDayDisplay(selectedDay)} 之事。</p>
    </div>
  );
} 
