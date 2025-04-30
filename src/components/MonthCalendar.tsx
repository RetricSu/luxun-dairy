import { DiaryEntry } from "../types";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "preact/hooks";

interface MonthCalendarProps {
  entries: DiaryEntry[];
}

export function MonthCalendar({ entries }: MonthCalendarProps) {
  const navigate = useNavigate();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiaryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Custom date state
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [yearInput, setYearInput] = useState<string>(viewDate.getFullYear().toString());
  const [monthInput, setMonthInput] = useState<string>((viewDate.getMonth() + 1).toString());
  
  // Get current viewed month and year
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  
  // 计算历史累计记录天数
  const getTotalEntriesCount = (): number => {
    return entries.length;
  };
  
  // 计算连续记录天数
  const getConsecutiveDaysCount = (): number => {
    if (entries.length === 0) return 0;
    
    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.day).getTime() - new Date(a.day).getTime()
    );
    
    // Start with the most recent entry
    const mostRecentDate = new Date(sortedEntries[0].day);
    mostRecentDate.setHours(0, 0, 0, 0);
    
    // First entry counts as 1
    let consecutiveDays = 1;
    
    // Check for consecutive days
    let expectedDate = new Date(mostRecentDate);
    expectedDate.setDate(expectedDate.getDate() - 1);
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].day);
      entryDate.setHours(0, 0, 0, 0);
      
      // If this entry matches the expected date
      if (entryDate.getTime() === expectedDate.getTime()) {
        consecutiveDays++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        // Chain is broken
        break;
      }
    }
    
    return consecutiveDays;
  };
  
  // Generate days for current month with proper calendar layout
  const getCalendarDays = () => {
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    // Get number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get number of days in previous month
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const days = [];
    const weeks = [];
    
    // Add days from previous month to fill the first week
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevDay = daysInPrevMonth - firstDayOfMonth + i + 1;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const date = new Date(prevYear, prevMonth, prevDay);
      days.push({
        date: date.toLocaleDateString('en-CA'),
        currentMonth: false
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date: date.toLocaleDateString('en-CA'),
        currentMonth: true
      });
    }
    
    // Add days from next month to complete the grid
    const remainingCells = 35 - days.length; // 5 rows of 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const date = new Date(nextYear, nextMonth, day);
      days.push({
        date: date.toLocaleDateString('en-CA'),
        currentMonth: false
      });
    }
    
    // Group days into weeks
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };
  
  const calendarWeeks = getCalendarDays();
  
  // Check if a day has an entry
  const getDayEntry = (day: string) => {
    return entries.find(entry => entry.day === day);
  };
  
  // Check if a date is today
  const isToday = (dateString: string) => {
    return dateString === new Date().toLocaleDateString('en-CA');
  };
  
  // Handle click on a day
  const handleDayClick = (day: string, isCurrentMonth: boolean, hasEntry: boolean) => {
    if (!isCurrentMonth) return;
    
    if (hasEntry) {
      // Scroll to the entry in the timeline
      const entryElement = document.getElementById(`entry-${day}`);
      if (entryElement) {
        entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        entryElement.classList.add('highlight-entry');
        setTimeout(() => {
          entryElement.classList.remove('highlight-entry');
        }, 1500);
      }
      return;
    }
    
    // If no entry, navigate to write page for that day
    navigate(`/?day=${day}`);
  };
  
  // Handle mouse enter on a day cell
  const handleMouseEnter = (_event: MouseEvent, day: string) => {
    setHoveredDay(day);
    
    // Get the cell element reference
    const cellElement = cellRefs.current.get(day);
    if (cellElement) {
      const rect = cellElement.getBoundingClientRect();
      const tooltipWidth = 250;
      
      // Position tooltip above the cell
      const top = rect.top + window.scrollY - 5; // 5px gap from cell
      let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2); // center horizontally
      
      // Ensure tooltip doesn't go off screen edges
      if (left < 10) left = 10;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      
      setTooltipPosition({
        top,
        left
      });
    }
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredDay(null);
  };
  
  // Get short preview for tooltip
  const getShortPreview = (entry?: DiaryEntry) => {
    if (!entry) return "";
    const firstLine = entry.content.split('\n')[0];
    return firstLine.length > 40 ? `${firstLine.substring(0, 40)}...` : firstLine;
  };
  
  // Get simplified date display (just show weekday)
  const getSimpleDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return weekdays[date.getDay()];
  };
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
    updateInputs(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
    updateInputs(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToCurrentMonth = () => {
    const today = new Date();
    setViewDate(today);
    updateInputs(today);
  };
  
  const handleYearMonthSubmit = () => {
    const year = parseInt(yearInput);
    const month = parseInt(monthInput) - 1; // Adjust for 0-indexed months
    
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return; // Invalid input
    }
    
    const newDate = new Date(year, month, 1);
    setViewDate(newDate);
  };
  
  // Search function
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    // Filter entries that contain the search query (case insensitive)
    const results = entries.filter(entry => 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
    setIsSearching(false);
  };
  
  // Handle search input change
  const handleSearchInputChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setSearchQuery(value);
    
    if (!value.trim()) {
      setShowSearchResults(false);
    }
  };
  
  // Navigate to search result
  const navigateToEntry = (entry: DiaryEntry) => {
    setShowSearchResults(false);
    setSearchQuery("");
    
    const entryElement = document.getElementById(`entry-${entry.day}`);
    if (entryElement) {
      entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      entryElement.classList.add('highlight-entry');
      setTimeout(() => {
        entryElement.classList.remove('highlight-entry');
      }, 1500);
    }
  };
  
  // Handle Enter key in search input
  const handleSearchKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Handle focus on search input
  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };
  
  // Update input fields when view date changes
  const updateInputs = (date: Date) => {
    setYearInput(date.getFullYear().toString());
    setMonthInput((date.getMonth() + 1).toString());
  };
  
  // Update inputs when viewDate changes
  useEffect(() => {
    updateInputs(viewDate);
  }, [viewDate]);
  
  // Get month name
  const getMonthName = () => {
    return `${currentYear}年${currentMonth + 1}月`;
  };
  
  // Handle clicks outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        showSearchResults
      ) {
        setShowSearchResults(false);
      }
      
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setHoveredDay(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchResults]);

  // Store cell ref for positioning tooltip
  const setCellRef = (element: HTMLDivElement | null, day: string) => {
    if (element) {
      cellRefs.current.set(day, element);
    }
  };

  // Day of week labels
  const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="bg-white dark:bg-[#1a1a1e] rounded-xl shadow mb-8 border border-[#e9e4d9] dark:border-[#2c2c32] flex flex-col md:flex-row">
      {/* Left side: Calendar */}
      <div className="p-5 w-full md:w-1/2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#5ba2ae] font-medium text-lg">{getMonthName()}</h2>
          <span className="text-[#a8a89e] text-sm">分享</span>
        </div>
        
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekdayLabels.map(day => (
            <div key={`header-${day}`} className="text-center text-xs text-[#a8a89e]">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarWeeks.slice(0, 5).flat().map((dayInfo, index) => {
            const entry = getDayEntry(dayInfo.date);
            const hasEntry = !!entry;
            const today = isToday(dayInfo.date);
            
            return (
              <div 
                key={dayInfo.date || `empty-${index}`}
                ref={(el) => setCellRef(el, dayInfo.date)}
                className="relative flex justify-center items-center"
                onMouseEnter={(e) => handleMouseEnter(e, dayInfo.date)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleDayClick(dayInfo.date, dayInfo.currentMonth, hasEntry)}
              >
                <div 
                  className={`
                    w-full h-8 flex items-center justify-center cursor-pointer transition-colors rounded-md
                    ${dayInfo.currentMonth 
                      ? hasEntry 
                        ? 'bg-[#43a595] hover:bg-[#389384]' 
                        : 'bg-[#7e7e92] dark:bg-[#262628] hover:bg-[#3c3c42]'
                      : 'bg-[#7e7e92] dark:bg-[#262628] opacity-50 cursor-default'}
                    ${today ? 'ring-1 ring-[#8aac2f]' : ''}
                    ${hoveredDay === dayInfo.date ? 'ring-1 ring-[#8aac2f]' : ''}
                  `}
                ></div>
              </div>
            );
          })}
        </div>
        
        {/* Month statistics */}
        <div className="mt-10 text-xs text-[#a8a89e] text-left">
          {(() => {
            // Count entries for current month only
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const entriesThisMonth = entries.filter(entry => {
              const entryDate = new Date(entry.day);
              return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            });
            return `本月记录了 ${entriesThisMonth.length}/${daysInMonth} 天`;
          })()}
        </div>
      </div>
      
      {/* Right side: Navigation controls */}
      <div className="p-5 w-full md:w-1/2 border-t md:border-t-0 md:border-l border-[#e9e4d9] dark:border-[#2c2c32] flex flex-col">
        <span className="text-[#a8a89e] text-sm mt-1 mb-5">
          {`累计记录 ${getTotalEntriesCount()} 天 · 已连续记录 ${getConsecutiveDaysCount()} 天`}
        </span>
        
        <div className="space-y-5">
          {/* Search box */}
          <div className="relative z-30">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="搜索日记内容..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                onFocus={handleSearchFocus}
                className="w-full bg-white dark:bg-[#1a1a1e] border border-[#e9e4d9] dark:border-[#2c2c32] rounded-md px-3 py-2 pr-10"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#43a595] hover:text-[#5ccfbc] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            
            {/* Floating search results */}
            {showSearchResults && (
              <div 
                ref={searchResultsRef}
                className="absolute w-full mt-1 bg-white dark:bg-[#1a1a1e] rounded-md border border-[#3c3c42] max-h-64 overflow-y-auto shadow-lg z-40"
              >
                {isSearching ? (
                  <div className="text-center py-4 text-sm text-[#717b7a]">
                    搜索中...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(entry => (
                    <div 
                      key={entry.id}
                      onClick={() => navigateToEntry(entry)}
                      className="px-3 py-2 hover:bg-[#d4d4d9] dark:hover:bg-[#403932] cursor-pointer border-b border-[#3c3c42] last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between text-xs">
                        <span className="text-[#5ba2ae]">{new Date(entry.day).toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'})}</span>
                        <span className="text-[#a8c555]">{entry.weather}</span>
                      </div>
                      <div className="text-xs mt-1 line-clamp-1">
                        {getShortPreview(entry)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-[#717b7a]">
                    未找到匹配结果
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Month navigation */}
          <div className="flex gap-2">
            <button 
              onClick={goToPreviousMonth}
              className="flex-1 py-2 bg-white dark:bg-[#1a1a1e] hover:bg-[#3c3c42] hover:text-[#e9e9e7] rounded-md transition-colors text-sm"
            >
              上个月
            </button>
            <button 
              onClick={goToCurrentMonth}
              className="flex-1 py-2 bg-white dark:bg-[#1a1a1e] hover:bg-[#3c3c42] hover:text-[#e9e9e7] rounded-md transition-colors text-sm"
            >
              回到今天
            </button>
            <button 
              onClick={goToNextMonth}
              className="flex-1 py-2 bg-white dark:bg-[#1a1a1e] hover:bg-[#3c3c42] hover:text-[#e9e9e7] rounded-md transition-colors text-sm"
            >
              下个月
            </button>
          </div>
          
          {/* Year/month input fields */}
          <div className="p-4 bg-white dark:bg-[#1a1a1e] rounded-md border border-[#e9e4d9] dark:border-[#2c2c32] ">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-[#a8a89e] mb-2">年</label>
                <input 
                  type="number" 
                  value={yearInput}
                  onChange={(e) => setYearInput((e.target as HTMLInputElement).value)}
                  className="w-full bg-white dark:bg-[#1a1a1e] border border-[#e9e4d9] dark:border-[#2c2c32]  rounded px-3 py-2"
                  min="1900"
                  max="2100"
                />
              </div>
              <div>
                <label className="block text-xs text-[#a8a89e] mb-2">月</label>
                <input 
                  type="number" 
                  value={monthInput}
                  onChange={(e) => setMonthInput((e.target as HTMLInputElement).value)}
                  className="w-full bg-white dark:bg-[#1a1a1e] border border-[#e9e4d9] dark:border-[#2c2c32]  rounded px-3 py-2"
                  min="1"
                  max="12"
                />
              </div>
            </div>
            <button 
              onClick={handleYearMonthSubmit}
              className="w-full py-2 bg-[#43a595] hover:bg-[#389384] text-white rounded-md transition-colors text-sm"
            >
              跳转到这个月
            </button>
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredDay && (
        <div 
          ref={tooltipRef}
          className="fixed z-50 bg-[#262630] shadow-lg rounded-md p-3 border border-[#3c3c42] w-64"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            pointerEvents: 'none',
            transform: 'translateY(-100%)', // Move above the cell
            transition: 'opacity 0.15s ease-out'
          }}
        >
          {(() => {
            const entry = getDayEntry(hoveredDay);
            const date = new Date(hoveredDay);
            const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
            const weekday = getSimpleDateDisplay(hoveredDay);
            
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[#5ba2ae] text-sm font-medium">
                    {formattedDate} {weekday}
                  </div>
                  {entry && (
                    <span className="text-xs text-[#a8c555] bg-[#2a3020] px-2 py-0.5 rounded-full ml-2">
                      {entry.weather}
                    </span>
                  )}
                </div>
                
                {entry ? (
                  <div className="text-xs text-[#e9e9e7] line-clamp-2 leading-relaxed">
                    {getShortPreview(entry)}
                  </div>
                ) : (
                  <div className="text-xs text-[#717b7a] italic">
                    {isToday(hoveredDay) ? "今日还未写日记" : "无日记记录"}
                  </div>
                )}
              </>
            );
          })()}
          
          {/* Small triangle pointing down to the cell */}
          <div 
            className="absolute w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#262630]"
            style={{
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          ></div>
        </div>
      )}
    </div>
  );
} 
