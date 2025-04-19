import { CompletedEntry } from "./CompletedEntry";
import { DayHeader } from "./DayHeader";
import { DiaryForm } from "./DiaryForm";

interface WriteContainerProps {
  dayHasEntry: boolean;
  selectedDay: string;
  content: string;
  setContent: (content: string) => void;
  weather: string;
  setWeather: (weather: string) => void;
  errorMessage: string;
  saveDiaryEntry: () => void;
}

export function WriteContainer({
  dayHasEntry,
  selectedDay,
  content,
  setContent,
  weather,
  setWeather,
  errorMessage,
  saveDiaryEntry
}: WriteContainerProps) {
  return (
    <div className="bg-white dark:bg-[#262624] rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-border-light dark:border-border-dark">
      {dayHasEntry ? (
        <CompletedEntry selectedDay={selectedDay} />
      ) : (
        <DiaryForm
          content={content}
          setContent={setContent}
          weather={weather}
          setWeather={setWeather}
          errorMessage={errorMessage}
          saveDiaryEntry={saveDiaryEntry}
        />
      )}
    </div>
  );
} 
