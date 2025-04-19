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
    <div className="max-w-4xl mx-auto">
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
