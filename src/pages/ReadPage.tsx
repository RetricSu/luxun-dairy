import { useState, useEffect } from "preact/hooks";
import { Timeline } from "../components/Timeline";
import { Header } from "../components/Header";
import { MonthCalendar } from "../components/MonthCalendar";
import * as diaryService from "../utils/diaryService";
import { useNavigate } from "react-router-dom";
import { DiaryEntry, CommonDiary } from "../types";
import { Modal } from "../components/Modal";
import { NostrEventViewer } from "../components/NostrEventViewer";
import { CommonDiaryReader } from "../components/CommonDiaryReader";
import { FriendDiaryReader } from "../components/FriendDiaryReader";

export function ReadPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const selectedDay = new Date().toLocaleDateString('en-CA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNostrEvent, setSelectedNostrEvent] = useState<string | null>(null);
  const [nostrEventData, setNostrEventData] = useState<string | null>(null);
  
  // Common diary states
  const [commonDiaries, setCommonDiaries] = useState<CommonDiary[]>([]);
  const [activeTab, setActiveTab] = useState<string>("my-diary");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSource, setLoadingSource] = useState<string>("");

  useEffect(() => {
    loadEntries();
    loadCommonDiaries();
  }, []);

  async function loadEntries() {
    try {
      const entriesData = await diaryService.loadEntries();
      setEntries(entriesData);
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  }

  async function loadCommonDiaries() {
    setIsLoading(true);
    setLoadingSource("");
    try {
      // 记录开始时间，以便计算加载时间
      const startTime = performance.now();
      
      // 调用获取日记的接口
      const diariesData = await diaryService.loadCommonDiaries();
      
      // 计算加载时间
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);
      
      // 设置数据和加载信息
      setCommonDiaries(diariesData);
      
      // 根据加载速度推测是否使用了缓存
      if (loadTime < 100 && diariesData.length > 0) {
        setLoadingSource(`${diariesData.length} 篇日记已从缓存加载 (${loadTime}ms)`);
      } else if (diariesData.length > 0) {
        setLoadingSource(`${diariesData.length} 篇日记已加载 (${loadTime}ms)`);
      } else {
        setLoadingSource("没有找到日记文件");
      }
    } catch (error) {
      console.error("Failed to load common diaries:", error);
      setLoadingSource("加载日记失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function viewNostrEvent(nostrId: string) {
    if (!nostrId) return;
    
    try {
      setSelectedNostrEvent(nostrId);
      const eventData = await diaryService.getNostrEvent(nostrId);
      setNostrEventData(eventData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to load Nostr event:", error);
    }
  }

  function closeNostrEventView() {
    setIsModalOpen(false);
    setSelectedNostrEvent(null);
    setNostrEventData(null);
  }

  function handleViewOriginal(entryId: string) {
    viewNostrEvent(entryId);
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-6 sm:px-10 min-h-screen bg-[#faf9f6] dark:bg-[#121214]">
      <Header 
        selectedDay={selectedDay}
        viewMode="view"
        onViewModeChange={() => navigate('/')}
      />

      {/* Tab Navigation */}
      <div className="mt-8 border-b border-[#e9e4d9] dark:border-[#2c2c32]">
        <div className="flex overflow-x-auto">
          <button 
            className={`px-4 py-2 mr-2 whitespace-nowrap text-sm font-medium rounded-t-lg transition-colors
              ${activeTab === "my-diary" 
                ? "bg-white dark:bg-[#1a1a1e] text-[#49b3a1] dark:text-[#43a595] border-t border-l border-r border-[#e9e4d9] dark:border-[#2c2c32]" 
                : "text-[#8c7c67] dark:text-[#a6a69e] hover:text-[#49b3a1] hover:dark:text-[#43a595]"}`}
            onClick={() => setActiveTab("my-diary")}
          >
            我的日记
          </button>

          <button 
            className={`px-4 py-2 mr-2 whitespace-nowrap text-sm font-medium rounded-t-lg transition-colors
              ${activeTab === "friend-diaries" 
                ? "bg-white dark:bg-[#1a1a1e] text-[#49b3a1] dark:text-[#43a595] border-t border-l border-r border-[#e9e4d9] dark:border-[#2c2c32]" 
                : "text-[#8c7c67] dark:text-[#a6a69e] hover:text-[#49b3a1] hover:dark:text-[#43a595]"}`}
            onClick={() => setActiveTab("friend-diaries")}
          >
           收件箱 
          </button>
          
          {commonDiaries.map((diary) => (
            <button 
              key={diary.author}
              className={`px-4 py-2 mr-2 whitespace-nowrap text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === diary.author 
                  ? "bg-white dark:bg-[#1a1a1e] text-[#49b3a1] dark:text-[#43a595] border-t border-l border-r border-[#e9e4d9] dark:border-[#2c2c32]" 
                  : "text-[#8c7c67] dark:text-[#a6a69e] hover:text-[#49b3a1] hover:dark:text-[#43a595]"}`}
              onClick={() => setActiveTab(diary.author)}
            >
              {diary.title || diary.author}
            </button>
          ))}
        </div>
        
        {/* Loading info */}
        {loadingSource && !isLoading && activeTab !== "my-diary" && activeTab !== "friend-diaries" && (
          <div className="flex items-center px-1 py-1 mt-1 mb-1">
            <span className="text-xs text-[#8c7c67] dark:text-[#a6a69e] flex items-center">
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {loadingSource}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-center py-8 px-6 text-[#8c7c67] dark:text-[#a6a69e] italic">
              加载中...
            </p>
          </div>
        ) : activeTab === "my-diary" ? (
          <>
            <MonthCalendar entries={entries} />
            <Timeline entries={entries} viewNostrEvent={viewNostrEvent} />
          </>
        ) : activeTab === "friend-diaries" ? (
          <FriendDiaryReader onViewOriginal={handleViewOriginal} />
        ) : (
          <div>
            <div className="mb-6 bg-[#f9f6f0] dark:bg-[#2a2a28] p-4 rounded-lg">
              <h2 className="text-xl font-medium mb-1 text-[#49818b] dark:text-[#49818b]">
                {commonDiaries.find(d => d.author === activeTab)?.title || activeTab}
              </h2>
              <p className="text-sm text-[#8c7c67] dark:text-[#a6a69e]">
                共 {commonDiaries.find(d => d.author === activeTab)?.count || 0} 篇日记
              </p>
            </div>
            <CommonDiaryReader 
              diary={commonDiaries.find(d => d.author === activeTab) || { author: "", count: 0, items: [] }} 
            />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeNostrEventView}>
        {selectedNostrEvent && nostrEventData ? (
          <NostrEventViewer
            selectedNostrEvent={selectedNostrEvent}
            nostrEventData={nostrEventData}
            closeNostrEventView={closeNostrEventView}
          />
        ) : (
          <div className="bg-white dark:bg-[#262624] rounded-md p-8 text-center">
            <p className="text-lg mb-4">无法加载 Nostr 事件数据</p>
            <button 
              onClick={closeNostrEventView} 
              className="bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white py-2 px-5 rounded-full hover:shadow-md"
            >
              关闭
            </button>
          </div>
        )}
      </Modal>
    </main>
  );
} 
