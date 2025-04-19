import { ViewMode } from "../types";
import { DayHeader } from "./DayHeader";

interface HeaderProps {
  selectedDay: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export function Header({ selectedDay, viewMode, setViewMode, showSettings, setShowSettings }: HeaderProps) {
  return (
    <header className="flex justify-between items-center mb-8 pb-4 border-b border-border-light dark:border-border-dark">
      <DayHeader selectedDay={selectedDay} />
      <div className="flex gap-3">
        <button 
          className="bg-[#f0f0eb] text-text-secondary border border-border-light py-2 px-4 text-[14px] rounded hover:bg-[#e8e8e3] transition-colors dark:bg-[#2a2a28] dark:text-text-secondary-dark dark:border-border-dark dark:hover:bg-[#333331]"
          onClick={() => setViewMode(viewMode === "write" ? "view" : "write")}
        >
          {viewMode === "write" ? "查看日记" : "写日记"}
        </button>
        
        <button 
          className="bg-[#f0f0eb] text-text-secondary border border-border-light py-2 px-4 text-[14px] rounded hover:bg-[#e8e8e3] transition-colors dark:bg-[#2a2a28] dark:text-text-secondary-dark dark:border-border-dark dark:hover:bg-[#333331]"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? "隐藏设置" : "设置"}
        </button>
      </div>
    </header>
  );
} 
