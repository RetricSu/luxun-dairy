import { formatDayDisplay } from "../utils/helpers";

interface CompletedEntryProps {
  selectedDay: string;
}

export function CompletedEntry({ selectedDay }: CompletedEntryProps) {
  return (
    <div className="py-10 px-8 text-center">
      <div className="text-center mb-4">
        <span className="inline-block bg-accent dark:bg-accent-dark text-white w-14 h-14 leading-[3.5rem] text-2xl rounded-full mb-6 dark:opacity-95">✓</span>
        <h3 className="m-0 mb-3 text-2xl text-[#4a8c82] dark:text-text-primary-dark font-medium">今日日记已完成！</h3>
        <h3 className="text-xl font-medium text-[#5f5e56] dark:text-text-primary-dark tracking-wide m-0 mb-3">{formatDayDisplay(selectedDay)}</h3>
        <p className="text-[#6d7a75] dark:text-text-secondary-dark text-lg m-0">您已记录下今天的思绪与感悟。</p>
      </div>
    </div>
  );
} 
