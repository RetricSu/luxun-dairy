import { formatDayDisplay, isToday } from "../utils/helpers";

interface DayHeaderProps {
  selectedDay: string;
}

export function DayHeader({ selectedDay }: DayHeaderProps) {
  return (
    <div className="flex items-center px-6 py-5 bg-rice-paper dark:bg-[#2a2a28]">
      <h2 className="text-xl font-medium text-[#5f5e56] dark:text-text-primary-dark tracking-wide m-0">
        {formatDayDisplay(selectedDay)}
      </h2>
      {isToday(selectedDay) && (
        <span className="ml-3 bg-accent dark:bg-accent-dark dark:opacity-85 text-white text-xs font-medium px-2 py-1 rounded">
          今天
        </span>
      )}
    </div>
  );
} 
