import { isToday } from "../utils/helpers";

interface DayHeaderProps {
  selectedDay: string;
}

export function DayHeader({ selectedDay }: DayHeaderProps) {
  // 自定义日期格式化，采用更具审美感的布局
  const formatCustomDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekdayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const weekday = weekdayNames[date.getDay()];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return (
      <div className="flex items-baseline">
        
        <span className="text-[#444440] dark:text-[#c0c0b8] font-normal">{month}月{day}日</span>
        <span className=" text-[#b0b0a8] dark:text-[#7a7a74] opacity-50">·</span>
        <span className="text-[#666660] dark:text-[#a6a6a0] font-light">{weekday}</span>
        <span className="mx-1 text-[#b0b0a8] dark:text-[#7a7a74] opacity-30">·</span>
        <span className="text-[#b0b0a8] dark:text-[#7a7a74] text-sm font-light">{year}年</span>
        {isToday(dateString) && (
          <>
           <span className="mx-1 text-[#b0b0a8] dark:text-[#7a7a74] opacity-30">·</span>
           <span className="text-[#aaa8a0] dark:text-[#666660] text-xs font-light mr-2">今天</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-row items-center py-1">
      <h2 className="font-normal text-lg tracking-wide m-0">
        {formatCustomDate(selectedDay)}
      </h2>
    </div>
  );
} 
