import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface DiaryEntry {
  id: string;
  content: string;
  weather: string;
  created_at: string;
  nostr_id?: string;
  day: string; // YYYY-MM-DD format
}

function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dayHasEntry, setDayHasEntry] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"write" | "view">("write");
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
      const publicKey = await invoke<string>("get_nostr_public_key");
      setNostrPublicKey(publicKey);
    } catch (error) {
      console.error("Failed to load Nostr public key:", error);
    }
  }

  async function loadEntries() {
    try {
      const entriesData = await invoke<DiaryEntry[]>("get_diary_entries");
      setEntries(entriesData);
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  }

  async function checkDayHasEntry(day: string) {
    try {
      const hasEntry = await invoke<boolean>("check_day_has_entry", { day });
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
      await invoke<DiaryEntry>("save_diary_entry", { 
        content, 
        weather,
        day: selectedDay
      });
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
      const eventData = await invoke<string>("get_nostr_event", { nostrId });
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function formatNostrEvent(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  }

  function shortenKey(key: string) {
    if (!key) return '';
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  }

  function handleDayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setSelectedDay(target.value);
  }

  function formatDayDisplay(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  const isToday = selectedDay === new Date().toISOString().split('T')[0];

  return (
    <main class="main-container">
      <header className="app-header">
        <h1>Lu Xun's Diary</h1>
        
        <div className="header-actions">
          <button 
            className="header-button"
            onClick={() => setViewMode(viewMode === "write" ? "view" : "write")}
          >
            {viewMode === "write" ? "View Entries" : "Write Entry"}
          </button>
          
          <button 
            className="header-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? "Hide Settings" : "Settings"}
          </button>
        </div>
      </header>
      
      {showSettings && (
        <div className="settings-panel">
          {nostrPublicKey && (
            <div className="settings-item">
              <span className="settings-label">Nostr Public Key:</span>
              <span className="settings-value" title={nostrPublicKey}>
                {shortenKey(nostrPublicKey)}
              </span>
            </div>
          )}
          
          <div className="settings-item">
            <span className="settings-label">Selected Date:</span>
            <input
              type="date"
              value={selectedDay}
              onChange={handleDayChange}
              className="date-input"
            />
          </div>
        </div>
      )}

      {viewMode === "write" ? (
        <div className="write-container">
          <div className="day-header">
            <h2 className="day-title">{formatDayDisplay(selectedDay)}</h2>
            {isToday && <span className="today-badge">Today</span>}
          </div>
          
          {dayHasEntry ? (
            <div className="completed-entry">
              <div className="completion-message">
                <span className="checkmark">✓</span>
                <h3>Today's entry completed!</h3>
                <p>Well done on capturing your thoughts for the day.</p>
              </div>
            </div>
          ) : (
            <div className="entry-form">
              <div className="form-group compact">
                <label htmlFor="weather">Weather</label>
                <input
                  id="weather"
                  value={weather}
                  onInput={(e) => setWeather(e.currentTarget.value)}
                  placeholder="How's the weather today?"
                />
              </div>
              
              <div className="form-group main-textarea">
                <label htmlFor="content">Write your thoughts...</label>
                <textarea
                  id="content"
                  value={content}
                  onInput={(e) => setContent(e.currentTarget.value)}
                  placeholder="What's on your mind today?"
                  rows={15}
                />
              </div>
              
              {errorMessage && (
                <div className="error-message">{errorMessage}</div>
              )}
              
              <button 
                className="save-button"
                onClick={saveDiaryEntry} 
                disabled={!content.trim()}
              >
                Save Entry
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="entries-list">
          {selectedNostrEvent && nostrEventData ? (
            <div className="nostr-event-view">
              <div className="nostr-event-header">
                <h3>Nostr Event: {selectedNostrEvent.substring(0, 8)}...</h3>
                <button className="close-button" onClick={closeNostrEventView}>Close</button>
              </div>
              <pre className="nostr-event-content">{formatNostrEvent(nostrEventData)}</pre>
            </div>
          ) : (
            entries.length > 0 ? (
              entries.map((entry) => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-header">
                    <span className="entry-date">{formatDate(entry.created_at)}</span>
                    <span className="entry-day">{entry.day}</span>
                    <span className="entry-weather">Weather: {entry.weather}</span>
                  </div>
                  <div className="entry-content">
                    {entry.content.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  {entry.nostr_id && (
                    <div className="entry-footer">
                      <span className="nostr-id">
                        Nostr ID: {shortenKey(entry.nostr_id)}
                        <button 
                          className="view-nostr-button"
                          onClick={() => viewNostrEvent(entry.nostr_id as string)}
                        >
                          View
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-entries">No entries yet. Start writing!</p>
            )
          )}
        </div>
      )}
    </main>
  );
}

export default App;
