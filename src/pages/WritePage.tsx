import { useState, useEffect } from "preact/hooks";
import { WriteContainer } from "../components/WriteContainer";
import { Header } from "../components/Header";
import * as diaryService from "../utils/diaryService";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DiaryEntry } from "../types";

export function WritePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>(
    dateParam || new Date().toLocaleDateString('en-CA')
  );
  const [dayHasEntry, setDayHasEntry] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    checkDayHasEntry(selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    if (dateParam && dateParam !== selectedDay) {
      setSelectedDay(dateParam);
    }
  }, [dateParam]);

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

  return (
    <main className="max-w-4xl mx-auto py-8 px-6 sm:px-10 min-h-screen bg-[#faf9f6] dark:bg-[#121214]">
      <Header 
        selectedDay={selectedDay}
        viewMode="write"
        onViewModeChange={() => navigate('/timeline')}
      />

      <div className="mt-8">
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
      </div>
    </main>
  );
} 
