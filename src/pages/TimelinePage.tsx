import { useState, useEffect } from "preact/hooks";
import { Timeline } from "../components/Timeline";
import { Header } from "../components/Header";
import { MonthCalendar } from "../components/MonthCalendar";
import * as diaryService from "../utils/diaryService";
import { useNavigate } from "react-router-dom";
import { DiaryEntry } from "../types";
import { Modal } from "../components/Modal";
import { NostrEventViewer } from "../components/NostrEventViewer";

export function TimelinePage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const selectedDay = new Date().toLocaleDateString('en-CA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNostrEvent, setSelectedNostrEvent] = useState<string | null>(null);
  const [nostrEventData, setNostrEventData] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const entriesData = await diaryService.loadEntries();
      setEntries(entriesData);
    } catch (error) {
      console.error("Failed to load entries:", error);
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

  return (
    <main className="max-w-4xl mx-auto py-8 px-6 sm:px-10 min-h-screen bg-[#faf9f6] dark:bg-[#121214]">
      <Header 
        selectedDay={selectedDay}
        viewMode="view"
        onViewModeChange={() => navigate('/')}
      />

      <div className="mt-8">
        <MonthCalendar entries={entries} />
        
        <Timeline 
          entries={entries}
          viewNostrEvent={viewNostrEvent}
        />
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
