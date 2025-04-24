import { useState, useEffect } from "preact/hooks";
import { NostrEventViewer } from "../components/NostrEventViewer";
import { Header } from "../components/Header";
import * as diaryService from "../utils/diaryService";
import { useNavigate, useParams } from "react-router-dom";

export function NostrEventPage() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [nostrEventData, setNostrEventData] = useState<string | null>(null);
  const selectedDay = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    if (eventId) {
      loadNostrEvent(eventId);
    }
  }, [eventId]);

  async function loadNostrEvent(nostrId: string) {
    try {
      const eventData = await diaryService.getNostrEvent(nostrId);
      setNostrEventData(eventData);
    } catch (error) {
      console.error("Failed to load Nostr event:", error);
      setNostrEventData(null);
    }
  }

  function closeNostrEventView() {
    navigate('/timeline');
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-6 sm:px-10 min-h-screen bg-[#faf9f6] dark:bg-[#121214]">
      <Header 
        selectedDay={selectedDay}
        viewMode="view"
        onViewModeChange={() => navigate('/')}
      />

      <div className="mt-8">
        {eventId && nostrEventData ? (
          <NostrEventViewer
            selectedNostrEvent={eventId}
            nostrEventData={nostrEventData}
            closeNostrEventView={closeNostrEventView}
          />
        ) : (
          <div className="text-center p-12">
            <p className="text-lg">无法加载 Nostr 事件数据</p>
            <button 
              onClick={() => navigate('/timeline')} 
              className="mt-4 bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white py-2 px-5 rounded-full hover:shadow-md"
            >
              返回时间线
            </button>
          </div>
        )}
      </div>
    </main>
  );
} 
