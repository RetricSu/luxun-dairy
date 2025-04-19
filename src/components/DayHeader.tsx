import { formatDayDisplay, isToday } from "../utils/helpers";

interface DayHeaderProps {
  selectedDay: string;
}

export function DayHeader({ selectedDay }: DayHeaderProps) {
  return (
    <div className="flex items-center">
      <h2 className="font-medium text-[#3c3b33] dark:text-[#e9e9e7] tracking-wide m-0">
        {formatDayDisplay(selectedDay)}
      </h2>
      {isToday(selectedDay) && (
        <span className="ml-3 bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
          今天
        </span>
      )}
    </div>
  );
} 
