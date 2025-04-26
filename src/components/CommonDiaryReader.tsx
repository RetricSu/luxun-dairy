import { useState, useEffect, useMemo } from "preact/hooks";
import { CommonDiary, CommonDiaryItem } from "../types";
import { formatShortDate } from "../utils/helpers";

interface CommonDiaryReaderProps {
  diary: CommonDiary;
}

export function CommonDiaryReader({ diary }: CommonDiaryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10; // 每页显示固定10条
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredItems, setFilteredItems] = useState<CommonDiaryItem[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [randomSeed, setRandomSeed] = useState<number | null>(null); // null表示不随机排序
  
  // 提取所有唯一标签
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    
    diary.items.forEach(item => {
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    // 转换为数组并按字母顺序排序
    return Array.from(tagsSet).sort();
  }, [diary.items]);
  
  // 当日记内容、搜索条件或选中标签改变时，更新过滤后的条目
  useEffect(() => {
    let results = diary.items;
    
    // 先按标签筛选 - 确保条目包含所有选中的标签
    if (selectedTags.length > 0) {
      results = results.filter(item => {
        // 确保条目有标签
        const itemTags = item.tags || [];
        if (itemTags.length === 0) {
          return false;
        }
        
        // 检查条目是否包含所有选中的标签
        return selectedTags.every(selectedTag => 
          itemTags.includes(selectedTag)
        );
      });
    }
    
    // 再按搜索词筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item => 
        (item.title?.toLowerCase().includes(term) || false) ||
        item.content.toLowerCase().includes(term) ||
        (item.date_raw?.toLowerCase().includes(term) || false) ||
        (item.tags?.some(tag => tag.toLowerCase().includes(term)) || false)
      );
    }
    
    // 应用随机排序
    if (randomSeed !== null) {
      // 使用Fisher-Yates洗牌算法随机排序
      const shuffled = [...results];
      
      // 使用固定的随机种子确保分页时顺序一致
      const random = seedRandom(randomSeed);
      
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      results = shuffled;
    }
    
    setFilteredItems(results);
    // 重置到第一页
    setCurrentPage(0);
  }, [diary.items, searchTerm, selectedTags, randomSeed]);

  // 切换随机排序 - 每次点击都重新洗牌
  const toggleRandom = () => {
    setRandomSeed(randomSeed === null ? Date.now() : Date.now());
  };
  
  // 清除随机排序
  const clearRandom = () => {
    setRandomSeed(null);
  };
  
  // 简易伪随机数生成器（基于种子）
  const seedRandom = (seed: number) => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };

  // 处理标签点击 - 支持多选
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // 如果标签已经被选中，则移除它
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      // 否则添加到已选标签中
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // 清除所有选中的标签
  const clearTags = () => {
    setSelectedTags([]);
  };
  
  // 移除单个标签
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
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
      {/* 搜索区域 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="搜索日记内容、标题、日期或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              className="text-sm w-full px-4 py-2 pl-10 rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32] bg-white dark:bg-[#1a1a1e] text-[#2c2c2a] dark:text-[#e9e9e7] focus:outline-none focus:ring-2 focus:ring-[#49b3a1] dark:focus:ring-[#43a595]"
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
          
          <div className="flex flex-row gap-2">
            {/* 随机排序按钮 */}
            <div className="flex-shrink-0">
              <button 
                onClick={toggleRandom}
                className="text-sm flex items-center px-4 py-2 rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32] bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a6a69e] hover:bg-[#e9e4d9] dark:hover:bg-[#2c2c36] transition-colors"
              >
                <svg 
                  className="h-4 w-4 mr-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                随机
              </button>
            </div>
            
            {/* 所有标签按钮 */}
            {allTags.length > 0 && (
              <div className="flex-shrink-0">
                <button 
                  onClick={() => setShowAllTags(!showAllTags)}
                  className={`text-sm flex items-center px-4 py-2 rounded-lg border transition-colors
                    ${showAllTags
                      ? "bg-[#49b3a1] dark:bg-[#43a595] text-white border-[#49b3a1] dark:border-[#43a595]"
                      : "bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a6a69e] border-[#e9e4d9] dark:border-[#2c2c32] hover:bg-[#e9e4d9] dark:hover:bg-[#2c2c36]"
                    }`}
                >
                  <svg 
                    className="h-4 w-4 mr-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {showAllTags ? "隐藏标签" : "全部标签"}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* 全部标签列表 */}
        {showAllTags && allTags.length > 0 && (
          <div className="mt-3 p-4 bg-[#f9f6f0] dark:bg-[#232328] rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-[#49818b] dark:text-[#49818b]">
                可用标签 ({allTags.length})
              </h3>
              {selectedTags.length > 0 && (
                <button 
                  onClick={clearTags}
                  className="text-xs text-[#49b3a1] dark:text-[#43a595] hover:underline"
                >
                  清除所有已选
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, index) => (
                <button 
                  key={index} 
                  onClick={() => handleTagClick(tag)}
                  className={`text-xs py-0.5 px-2 border rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-[#49b3a1] dark:bg-[#43a595] text-white border-[#49b3a1] dark:border-[#43a595]" 
                      : "bg-white dark:bg-[#1a1a1e] text-[#6d6a5c] dark:text-[#a2e2d8] border-[#e6e1d5] dark:border-[#323237] hover:bg-[#e9e4d9] dark:hover:bg-[#2c2c36]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      
        {/* 搜索结果信息和过滤状态 */}
        <div className="mt-2 mb-4 text-sm text-[#8c7c67] dark:text-[#a6a69e]">
          <div className="flex items-center flex-wrap gap-y-2">
            {(searchTerm || selectedTags.length > 0 || randomSeed !== null) && (
              <span>找到 {filteredItems.length} 条结果</span>
            )}
            
            {(searchTerm || selectedTags.length > 0 || randomSeed !== null) && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTags([]);
                  setRandomSeed(null);
                }}
                className="ml-2 text-[#49b3a1] dark:text-[#43a595] hover:underline"
              >
                重置
              </button>
            )}
            
            {randomSeed !== null && (
              <span className="ml-2 flex items-center text-[#718328] dark:text-[#8da042]">
                <svg 
                  className="h-3.5 w-3.5 mr-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                随机排序已启用
              </span>
            )}
          </div>
          
          {/* 显示选中的标签 */}
          {selectedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span>已筛选标签:</span>
              {selectedTags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-[#49b3a1] dark:bg-[#43a595] text-white text-xs py-0.5 px-2 rounded-full flex items-center"
                >
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)} 
                    className="ml-1 hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {selectedTags.length > 1 && (
                <button 
                  onClick={clearTags}
                  className="text-[#49b3a1] dark:text-[#43a595] hover:underline text-xs"
                >
                  清除所有标签
                </button>
              )}
            </div>
          )}
        </div>
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
            
            {/* 可点击的标签显示 */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 sm:mt-0 ml-0 sm:ml-4">
                {entry.tags.map((tag, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleTagClick(tag)}
                    className={`text-xs py-0.5 px-2 border rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-[#49b3a1] dark:bg-[#43a595] text-white border-[#49b3a1] dark:border-[#43a595]" 
                        : "bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] border-[#e6e1d5] dark:border-[#323237] hover:bg-[#e9e4d9] dark:hover:bg-[#2c2c36]"
                    }`}
                  >
                    {tag}
                  </button>
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
