import { useState, useEffect } from "preact/hooks";
import { Timeline } from "../components/Timeline";
import { Header } from "../components/Header";
import * as diaryService from "../utils/diaryService";
import { useNavigate } from "react-router-dom";
import { DiaryEntry } from "../types";

export function TimelinePage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const selectedDay = new Date().toLocaleDateString('en-CA');

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

  function viewNostrEvent(nostrId: string) {
    if (!nostrId) return;
    navigate(`/nostr/${nostrId}`);
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-6 sm:px-10 min-h-screen bg-[#faf9f6] dark:bg-[#121214]">
      <Header 
        selectedDay={selectedDay}
        viewMode="view"
        onViewModeChange={() => navigate('/')}
      />

      <div className="mt-8">
        <Timeline 
          entries={entries}
          viewNostrEvent={viewNostrEvent}
        />
      </div>
    </main>
  );
} 
