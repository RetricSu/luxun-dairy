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
    <div>
      <div className="relative mb-6 bg-white dark:bg-[#222226] rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32] shadow-sm overflow-hidden">
        <textarea
          id="content"
          value={content}
          onInput={(e) => setContent(e.currentTarget.value)}
          placeholder="只记录今天所做之小事大事，不记录任何所思所想，这是鲁迅日记 App 的推荐写法。"
          rows={6}
          className="w-full p-6 bg-transparent text-[#2c2c2a] dark:text-[#e9e9e7] leading-7 outline-none transition-all resize-none tracking-wide border-none focus:ring-0"
        />
        <div className="absolute right-3 bottom-3 text-[#a9a89e] dark:text-[#575752] text-xs">
          {content.length > 0 ? `${content.length} 字` : ''}
        </div>
      </div>
      
      {errorMessage && (
        <div className="text-[#94312a] bg-[#fbf0ee] border border-[#f5d8d4] p-4 rounded-lg mb-6">
          {errorMessage}
        </div>
      )}
      
      <div className="flex items-center gap-5 mt-6">
        <div className="relative flex-none w-[180px]">
          <label htmlFor="weather" className="absolute -top-2 left-3 px-1 text-xs text-[#8c8b85] dark:text-[#717b7a] bg-white dark:bg-[#222226]">
            今日天气
          </label>
          <input
            id="weather"
            className="w-full text-sm p-3 h-11 rounded-lg border border-[#e9e4d9] dark:border-[#2c2c32] bg-white dark:bg-[#222226] text-[#2c2c2a] dark:text-[#e9e9e7] focus:border-[#69b6a9] dark:focus:border-[#389384] focus:outline-none transition-colors"
            value={weather}
            onInput={(e) => setWeather(e.currentTarget.value)}
            placeholder="晴朗、雨天..."
          />
        </div>
        
        <button 
          className="bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white font-medium px-8 py-3 h-11 border-0 rounded-lg shadow-sm transition-all active:translate-y-px flex items-center justify-center tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={saveDiaryEntry} 
          disabled={!content.trim()}
        >
          落笔成文
        </button>
      </div>
    </div>
  );
} 
