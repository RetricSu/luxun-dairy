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

  useEffect(() => {
    loadEntries();
  }, []);

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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  return (
    <main class="container">
      <h1>Lu Xun's Diary</h1>
      
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
          {entries.length > 0 ? (
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
                    <small>Nostr ID: {entry.nostr_id.substring(0, 10)}...</small>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p class="no-entries">No entries yet. Start writing!</p>
          )}
        </div>
      )}
    </main>
  );
}

export default App;
