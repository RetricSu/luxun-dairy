import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface DiaryEntry {
  id: string;
  content: string;
  weather: string;
  created_at: string;
  nostr_id?: string;
}

function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("");
  const [viewMode, setViewMode] = useState<"write" | "view">("write");
  const [selectedNostrEvent, setSelectedNostrEvent] = useState<string | null>(null);
  const [nostrEventData, setNostrEventData] = useState<string | null>(null);
  const [nostrPublicKey, setNostrPublicKey] = useState<string>("");

  useEffect(() => {
    loadEntries();
    loadNostrPublicKey();
  }, []);

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
      setEntries(entriesData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  }

  async function saveDiaryEntry() {
    if (!content.trim()) return;
    
    try {
      await invoke("save_diary_entry", { content, weather });
      setContent("");
      setWeather("");
      await loadEntries();
    } catch (error) {
      console.error("Failed to save entry:", error);
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

  return (
    <main class="container">
      <h1>Lu Xun's Diary</h1>
      
      {nostrPublicKey && (
        <div class="nostr-info">
          <span class="nostr-pubkey-label">Nostr Public Key:</span>
          <span class="nostr-pubkey-value" title={nostrPublicKey}>
            {shortenKey(nostrPublicKey)}
          </span>
        </div>
      )}
      
      <div class="tabs">
        <button 
          class={viewMode === "write" ? "active" : ""} 
          onClick={() => setViewMode("write")}
        >
          Write Entry
        </button>
        <button 
          class={viewMode === "view" ? "active" : ""} 
          onClick={() => setViewMode("view")}
        >
          View Entries
        </button>
      </div>

      {viewMode === "write" ? (
        <div class="write-mode">
          <div class="form-group">
            <label htmlFor="weather">Weather</label>
            <input
              id="weather"
              value={weather}
              onInput={(e) => setWeather(e.currentTarget.value)}
              placeholder="How's the weather today?"
            />
          </div>
          
          <div class="form-group">
            <label htmlFor="content">Diary Entry</label>
            <textarea
              id="content"
              value={content}
              onInput={(e) => setContent(e.currentTarget.value)}
              placeholder="Write your thoughts..."
              rows={10}
            />
          </div>
          
          <button onClick={saveDiaryEntry} disabled={!content.trim()}>
            Save Entry
          </button>
        </div>
      ) : (
        <div class="entries-list">
          {selectedNostrEvent && nostrEventData ? (
            <div class="nostr-event-view">
              <div class="nostr-event-header">
                <h3>Nostr Event: {selectedNostrEvent.substring(0, 8)}...</h3>
                <button class="close-button" onClick={closeNostrEventView}>Close</button>
              </div>
              <pre class="nostr-event-content">{formatNostrEvent(nostrEventData)}</pre>
            </div>
          ) : (
            entries.length > 0 ? (
              entries.map((entry) => (
                <div key={entry.id} class="entry-card">
                  <div class="entry-header">
                    <span class="entry-date">{formatDate(entry.created_at)}</span>
                    <span class="entry-weather">Weather: {entry.weather}</span>
                  </div>
                  <div class="entry-content">
                    {entry.content.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  {entry.nostr_id && (
                    <div class="entry-footer">
                      <span class="nostr-id">
                        Nostr ID: {shortenKey(entry.nostr_id)}
                        <button 
                          class="view-nostr-button"
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
              <p class="no-entries">No entries yet. Start writing!</p>
            )
          )}
        </div>
      )}
    </main>
  );
}

export default App;
