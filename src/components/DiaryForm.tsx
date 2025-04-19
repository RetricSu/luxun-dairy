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
    <div className="p-0">
      <textarea
        id="content"
        value={content}
        onInput={(e) => setContent(e.currentTarget.value)}
        placeholder="今天有什么想法、感受或值得记录的事情..."
        rows={15}
        className="w-full p-4 rounded bg-[#f9f9f6] dark:bg-[#1e1e22] text-text-primary dark:text-text-primary-dark border border-border-light dark:border-border-dark leading-7 outline-none transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] resize-none tracking-wide focus:border-[#afada1] dark:focus:border-accent-dark focus:shadow-[0_0_0_3px_rgba(175,173,161,0.1)]"
      />
      
      {errorMessage && (
        <div className="text-[#94312a] bg-[#fbf0ee] border border-[#f5d8d4] p-3 rounded mb-4 mt-4">
          {errorMessage}
        </div>
      )}
      
      <div className="flex items-center gap-4 mt-5">
        <input
          id="weather"
          className="flex-none w-[140px] text-sm p-2 h-10 border-0 border-b border-border-light dark:border-border-dark bg-transparent text-text-primary dark:text-text-primary-dark focus:border-[#afada1] dark:focus:border-accent-dark focus:outline-none transition-colors"
          value={weather}
          onInput={(e) => setWeather(e.currentTarget.value)}
          placeholder="今日天气..."
        />
        
        <button 
          className="bg-accent dark:bg-accent-dark text-white font-medium px-6 py-2 h-10 border-0 rounded hover:bg-[#3f7971] dark:hover:bg-[#4c9b90] transition-colors active:translate-y-px flex items-center justify-center tracking-wider disabled:bg-[#c7c7c2] disabled:cursor-not-allowed"
          onClick={saveDiaryEntry} 
          disabled={!content.trim()}
        >
          落笔成文
        </button>
      </div>
    </div>
  );
} 
