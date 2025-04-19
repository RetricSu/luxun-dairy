import { formatDayDisplay, isToday } from "../utils/helpers";

interface DayHeaderProps {
  selectedDay: string;
}

export function DayHeader({ selectedDay }: DayHeaderProps) {
  return (
    <div className="day-header">
      <h2 className="day-title">{formatDayDisplay(selectedDay)}</h2>
      {isToday(selectedDay) && <span className="today-badge">今天</span>}
    </div>
  );
} 
