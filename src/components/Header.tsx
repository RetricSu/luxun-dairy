import { ViewMode } from "../types";
import { DayHeader } from "./DayHeader";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  selectedDay: string;
  viewMode: ViewMode;
  onViewModeChange: () => void;
}

export function Header({ selectedDay, viewMode, onViewModeChange }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4">
      <div className="mb-4 sm:mb-0 opacity-85">
        <DayHeader selectedDay={selectedDay} />
      </div>
      
      <div className="flex gap-3">
        <button 
          className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
            viewMode === "write" 
              ? "bg-white dark:bg-[#1e1e22] text-[#5d5a4c] dark:text-[#a2e2d8] border border-[#e6e1d5] dark:border-[#323237] shadow-sm hover:shadow" 
              : "bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white hover:shadow-md"
          }`}
          onClick={onViewModeChange}
        >
          {viewMode === "write" ? "查看日记" : "写日记"}
        </button>
        
        <button 
          className="bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] text-sm font-medium py-2 px-5 border border-[#e6e1d5] dark:border-[#323237] rounded-full hover:bg-[#f0ede6] dark:hover:bg-[#2a2a32] transition-colors"
          onClick={() => navigate('/settings')}
        >
          设置
        </button>
      </div>
    </header>
  );
} 
