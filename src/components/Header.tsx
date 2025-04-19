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
    <header className="app-header">
      <DayHeader selectedDay={selectedDay} />
      <div className="header-actions">
        <button 
          className="header-button"
          onClick={() => setViewMode(viewMode === "write" ? "view" : "write")}
        >
          {viewMode === "write" ? "查看日记" : "写日记"}
        </button>
        
        <button 
          className="header-button"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? "隐藏设置" : "设置"}
        </button>
      </div>
    </header>
  );
} 
