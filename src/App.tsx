import { useEffect, useState } from "preact/hooks";
import "./App.css";
import { DiaryEntry, ViewMode } from "./types";
import { Header } from "./components/Header";
import { SettingsPanel } from "./components/SettingsPanel";
import { WriteContainer } from "./components/WriteContainer";
import { NostrEventViewer } from "./components/NostrEventViewer";
import { Timeline } from "./components/Timeline";
import * as diaryService from "./utils/diaryService";

function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dayHasEntry, setDayHasEntry] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("write");
  const [selectedNostrEvent, setSelectedNostrEvent] = useState<string | null>(null);
  const [nostrEventData, setNostrEventData] = useState<string | null>(null);
  const [nostrPublicKey, setNostrPublicKey] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    loadEntries();
    loadNostrPublicKey();
  }, []);

  useEffect(() => {
    checkDayHasEntry(selectedDay);
  }, [selectedDay]);

  async function loadNostrPublicKey() {
    try {
      const publicKey = await diaryService.loadNostrPublicKey();
      setNostrPublicKey(publicKey);
    } catch (error) {
      console.error("Failed to load Nostr public key:", error);
    }
  }

  async function loadEntries() {
    try {
      const entriesData = await diaryService.loadEntries();
      setEntries(entriesData);
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  }

  async function checkDayHasEntry(day: string) {
    try {
      const hasEntry = await diaryService.checkDayHasEntry(day);
      setDayHasEntry(hasEntry);
      if (hasEntry) {
        // Find the entry for this day
        const entry = entries.find(e => e.day === day);
        if (entry) {
          setContent(entry.content);
          setWeather(entry.weather);
        }
      } else {
        setContent("");
        setWeather("");
      }
    } catch (error) {
      console.error("Failed to check if day has entry:", error);
    }
  }

  async function saveDiaryEntry() {
    if (!content.trim()) return;
    setErrorMessage("");
    
    try {
      await diaryService.saveDiaryEntry(content, weather, selectedDay);
      await loadEntries();
      setDayHasEntry(true);
    } catch (error: any) {
      console.error("Failed to save entry:", error);
      setErrorMessage(error.toString());
    }
  }

  async function viewNostrEvent(nostrId: string) {
    if (!nostrId) return;
    
    try {
      setSelectedNostrEvent(nostrId);
      const eventData = await diaryService.getNostrEvent(nostrId);
      setNostrEventData(eventData);
    } catch (error) {
      console.error("Failed to load Nostr event:", error);
      setNostrEventData(null);
    }
  }

  function closeNostrEventView() {
    setSelectedNostrEvent(null);
    setNostrEventData(null);
  }

  function handleDayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setSelectedDay(target.value);
  }

  return (
    <main class="main-container">
      <Header 
        selectedDay={selectedDay}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />
      
      {showSettings && (
        <SettingsPanel
          nostrPublicKey={nostrPublicKey}
          selectedDay={selectedDay}
          handleDayChange={handleDayChange}
        />
      )}

      {viewMode === "write" ? (
        <WriteContainer
          dayHasEntry={dayHasEntry}
          selectedDay={selectedDay}
          content={content}
          setContent={setContent}
          weather={weather}
          setWeather={setWeather}
          errorMessage={errorMessage}
          saveDiaryEntry={saveDiaryEntry}
        />
      ) : selectedNostrEvent && nostrEventData ? (
        <NostrEventViewer
          selectedNostrEvent={selectedNostrEvent}
          nostrEventData={nostrEventData}
          closeNostrEventView={closeNostrEventView}
        />
      ) : (
        <Timeline 
          entries={entries}
          viewNostrEvent={viewNostrEvent}
        />
      )}
    </main>
  );
}

export default App;
