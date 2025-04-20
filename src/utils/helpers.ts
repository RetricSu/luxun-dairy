import { DiaryEntry } from "../types";

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatNostrEvent(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Add custom label for diary entry kind
    if (parsed.kind === 30027) {
      parsed.kind_label = "鲁迅日记格式 (30027)";
    }
    
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
}

export function shortenKey(key: string): string {
  if (!key) return '';
  return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
}

export function formatDayDisplay(dateString: string): string {
  const date = new Date(dateString);
  
  // 中文星期几
  const weekdayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekday = weekdayNames[date.getDay()];
  
  // 中文日期格式：年月日
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${year}年${month}月${day}日 ${weekday}`;
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

export function groupEntriesByYear(entries: DiaryEntry[]): Record<string, DiaryEntry[]> {
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.day).getTime() - new Date(a.day).getTime()
  );
  
  // Group by year
  const grouped: Record<string, DiaryEntry[]> = {};
  
  sortedEntries.forEach(entry => {
    const year = new Date(entry.day).getFullYear().toString();
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(entry);
  });
  
  return grouped;
}

export function isToday(dateString: string): boolean {
  return dateString === new Date().toLocaleDateString('en-CA');
} 
