import { useState, useEffect } from "preact/hooks";
import { CommonDiary, CommonDiaryItem } from "../types";
import { formatShortDate } from "../utils/helpers";

interface CommonDiaryReaderProps {
  diary: CommonDiary;
}

export function CommonDiaryReader({ diary }: CommonDiaryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10; // 每页显示固定10条
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<CommonDiaryItem[]>([]);
  
  // 当日记内容或搜索条件改变时，更新过滤后的条目
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(diary.items);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = diary.items.filter(item => 
        (item.title?.toLowerCase().includes(term) || false) ||
        item.content.toLowerCase().includes(term) ||
        (item.date_raw?.toLowerCase().includes(term) || false) ||
        (item.tags?.some(tag => tag.toLowerCase().includes(term)) || false)
      );
      setFilteredItems(filtered);
    }
    // 重置到第一页
    setCurrentPage(0);
  }, [diary.items, searchTerm]);
  
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  
  if (!diary || diary.items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-center py-8 px-6 text-[#8c7c67] dark:text-[#a6a69e] italic bg-[#f9f6f0] dark:bg-[#2a2a28] rounded-lg border border-dashed border-[#d9d0c1] dark:border-border-dark w-full max-w-2xl">
          暂无日记条目。
        </p>
      </div>
    );
  }

  // 获取当前页的日记条目
  const currentItems = filteredItems.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // 跳转到特定页
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  return (
    <div className="py-6">
      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索日记内容、标题、日期或标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32] bg-white dark:bg-[#1a1a1e] text-[#2c2c2a] dark:text-[#e9e9e7] focus:outline-none focus:ring-2 focus:ring-[#49b3a1] dark:focus:ring-[#43a595]"
          />
          <svg 
            className="absolute left-3 top-2.5 h-5 w-5 text-[#8c7c67] dark:text-[#6c6c6c]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      
        {/* 搜索结果信息 */}
        {searchTerm && (
          <div className="mt-2 mb-4 text-sm text-[#8c7c67] dark:text-[#a6a69e]">
            找到 {filteredItems.length} 条结果
            {filteredItems.length > 0 && searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="ml-2 text-[#49b3a1] dark:text-[#43a595] hover:underline"
              >
                清除搜索
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* 内容为空的提示 */}
      {filteredItems.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="text-center py-8 px-6 text-[#8c7c67] dark:text-[#a6a69e] italic bg-[#f9f6f0] dark:bg-[#2a2a28] rounded-lg border border-dashed border-[#d9d0c1] dark:border-border-dark w-full max-w-2xl">
            未找到匹配的日记条目。
          </p>
        </div>
      )}

      {/* 阅读视图 */}
      {currentItems.map((entry, index) => (
        <div key={index} className="bg-white dark:bg-[#1a1a1e] rounded-lg shadow-md border border-[#e9e4d9] dark:border-[#2c2c32] p-6 mb-6">
          {/* 日记标题和日期 */}
          <div className="mb-6 flex flex-wrap justify-between items-center pb-3 border-b border-[#f0ede4] dark:border-[#2a2a30]">
            <div>
              {entry.title && (
                <h2 className="text-md font-medium text-[#49818b] dark:text-[#49818b] mb-1">
                  {entry.title}
                </h2>
              )}
              <div className="flex items-center text-sm">
                {entry.date_raw && (
                  <span className="text-[#718328] dark:text-[#d0e57e] font-medium mr-3">
                    {entry.date_raw}
                  </span>
                )}
                {!entry.date_raw && entry.iso_date && (
                  <span className="text-[#718328] dark:text-[#d0e57e] font-medium mr-3">
                    {formatShortDate(entry.iso_date)}
                  </span>
                )}
                {entry.weather && (
                  <span className="text-[#6d6a5c] dark:text-[#a6a69e]">
                    {entry.weather}
                  </span>
                )}
              </div>
            </div>
            
            {/* 标签显示 */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 sm:mt-0 ml-0 sm:ml-4">
                {entry.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] text-xs py-0.5 px-2 border border-[#e6e1d5] dark:border-[#323237] rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* 日记内容 */}
          <div className="text-[#2c2c2a] dark:text-[#e9e9e7] font-normal">
            {entry.content.split("\n").map((line, i) => (
              <p key={i} className="mb-4 last:mb-0">{line}</p>
            ))}
          </div>
        </div>
      ))}
      
      {/* 分页控制 */}
      {filteredItems.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-wrap justify-between items-center">
          <div className="text-sm text-[#8c7c67] dark:text-[#a6a69e] mb-2 sm:mb-0">
            {currentPage + 1} / {totalPages} 页（共 {filteredItems.length} 篇）
          </div>
          <div className="flex flex-wrap space-x-2">
            {/* 固定宽度的分页导航 */}
            <button
              onClick={() => goToPage(0)}
              disabled={currentPage === 0}
              className={`px-3 py-1 rounded-md text-sm mb-1 ${
                currentPage === 0
                  ? "bg-[#e9e4d9] dark:bg-[#2c2c32] text-[#8c7c67] dark:text-[#6c6c6c] cursor-not-allowed"
                  : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
              }`}
            >
              首页
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className={`px-3 py-1 rounded-md text-sm mb-1 ${
                currentPage === 0
                  ? "bg-[#e9e4d9] dark:bg-[#2c2c32] text-[#8c7c67] dark:text-[#6c6c6c] cursor-not-allowed"
                  : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
              }`}
            >
              上一页
            </button>
            
            {/* 完全重写分页显示逻辑，确保一致性和固定布局 */}
            <div className="flex space-x-1 px-1">
              {(() => {
                // 动态生成页码按钮
                const pageButtons = [];
                
                // 显示的页码数量上限（不包括省略号）
                const maxVisiblePages = 5;
                
                if (totalPages <= maxVisiblePages + 2) {
                  // 如果总页数较少，直接显示所有页码
                  for (let i = 0; i < totalPages; i++) {
                    pageButtons.push(
                      <button
                        key={i}
                        onClick={() => goToPage(i)}
                        className={`px-3 py-1 min-w-[2.5rem] rounded-md text-sm mb-1 ${
                          currentPage === i
                            ? "bg-[#49b3a1] dark:bg-[#43a595] text-white"
                            : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                } else {
                  // 总页数较多，需要使用省略号
                  
                  // 始终显示第一页
                  pageButtons.push(
                    <button
                      key={0}
                      onClick={() => goToPage(0)}
                      className={`px-3 py-1 min-w-[2.5rem] rounded-md text-sm mb-1 ${
                        currentPage === 0
                          ? "bg-[#49b3a1] dark:bg-[#43a595] text-white"
                          : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
                      }`}
                    >
                      1
                    </button>
                  );
                  
                  // 计算中间页码的起始和结束
                  let startPage = Math.max(1, currentPage - Math.floor((maxVisiblePages - 2) / 2));
                  let endPage = Math.min(totalPages - 2, startPage + maxVisiblePages - 3);
                  
                  // 调整以确保显示正确数量的页码
                  if (endPage - startPage < maxVisiblePages - 3) {
                    startPage = Math.max(1, endPage - (maxVisiblePages - 3));
                  }
                  
                  // 第一页和起始页之间是否需要省略号
                  if (startPage > 1) {
                    pageButtons.push(
                      <span key="ellipsis1" className="px-1 py-1 text-[#8c7c67] dark:text-[#6c6c6c]">...</span>
                    );
                  }
                  
                  // 添加中间的页码
                  for (let i = startPage; i <= endPage; i++) {
                    pageButtons.push(
                      <button
                        key={i}
                        onClick={() => goToPage(i)}
                        className={`px-3 py-1 min-w-[2.5rem] rounded-md text-sm mb-1 ${
                          currentPage === i
                            ? "bg-[#49b3a1] dark:bg-[#43a595] text-white"
                            : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                  
                  // 结束页和最后一页之间是否需要省略号
                  if (endPage < totalPages - 2) {
                    pageButtons.push(
                      <span key="ellipsis2" className="px-1 py-1 text-[#8c7c67] dark:text-[#6c6c6c]">...</span>
                    );
                  }
                  
                  // 始终显示最后一页
                  pageButtons.push(
                    <button
                      key={totalPages - 1}
                      onClick={() => goToPage(totalPages - 1)}
                      className={`px-3 py-1 min-w-[2.5rem] rounded-md text-sm mb-1 ${
                        currentPage === totalPages - 1
                          ? "bg-[#49b3a1] dark:bg-[#43a595] text-white"
                          : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
                      }`}
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pageButtons;
              })()}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className={`px-3 py-1 rounded-md text-sm mb-1 ${
                currentPage === totalPages - 1
                  ? "bg-[#e9e4d9] dark:bg-[#2c2c32] text-[#8c7c67] dark:text-[#6c6c6c] cursor-not-allowed"
                  : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
              }`}
            >
              下一页
            </button>
            <button
              onClick={() => goToPage(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className={`px-3 py-1 rounded-md text-sm mb-1 ${
                currentPage === totalPages - 1
                  ? "bg-[#e9e4d9] dark:bg-[#2c2c32] text-[#8c7c67] dark:text-[#6c6c6c] cursor-not-allowed"
                  : "bg-[#f0ede4] dark:bg-[#2a2a30] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#333338]"
              }`}
            >
              末页
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
