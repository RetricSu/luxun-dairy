import { formatDayDisplay } from "../utils/helpers";

interface CompletedEntryProps {
  selectedDay: string;
}

export function CompletedEntry({ selectedDay }: CompletedEntryProps) {
  return (
    <div className="completed-entry">
      <div className="completion-message">
        <span className="checkmark">✓</span>
        <h3>今日日记已完成！</h3>
        <h3 className="day-title">{formatDayDisplay(selectedDay)}</h3>
        <p>您已记录下今天的思绪与感悟。</p>
      </div>
    </div>
  );
} 
