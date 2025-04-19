interface DiaryFormProps {
  content: string;
  setContent: (content: string) => void;
  weather: string;
  setWeather: (weather: string) => void;
  errorMessage: string;
  saveDiaryEntry: () => void;
}

export function DiaryForm({ 
  content, 
  setContent, 
  weather, 
  setWeather, 
  errorMessage, 
  saveDiaryEntry 
}: DiaryFormProps) {
  return (
    <div className="entry-form">
      <textarea
        id="content"
        value={content}
        onInput={(e) => setContent(e.currentTarget.value)}
        placeholder="今天有什么想法、感受或值得记录的事情..."
        rows={15}
      />
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      
      <div className="form-actions">
        <input
          id="weather"
          className="weather-input"
          value={weather}
          onInput={(e) => setWeather(e.currentTarget.value)}
          placeholder="今日天气..."
        />
        
        <button 
          className="save-button"
          onClick={saveDiaryEntry} 
          disabled={!content.trim()}
        >
          落笔成文
        </button>
      </div>
    </div>
  );
} 
