import { shortenKey } from "../utils/helpers";

interface SettingsPanelProps {
  nostrPublicKey: string;
  selectedDay: string;
  handleDayChange: (e: Event) => void;
}

export function SettingsPanel({ nostrPublicKey, selectedDay, handleDayChange }: SettingsPanelProps) {
  return (
    <div className="bg-rice-paper dark:bg-[#1a1a1e] border border-border-light dark:border-border-dark rounded-md p-4 mb-5">
      <div className="flex flex-col sm:flex-row gap-3">
        {nostrPublicKey && (
          <div className="flex items-center">
            <span className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mr-2">公钥:</span>
            <span className="font-mono text-xs p-1 px-2 bg-[#f0f0eb] dark:bg-[#262630] rounded text-[#5f5e56] dark:text-text-primary-dark" title={nostrPublicKey}>
              {shortenKey(nostrPublicKey)}
            </span>
          </div>
        )}
        
        <div className="flex items-center ml-auto">
          <span className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mr-2">日期:</span>
          <input
            type="date"
            value={selectedDay}
            onChange={handleDayChange}
            className="font-inherit p-1.5 px-2 rounded border border-border-light dark:border-border-dark text-sm outline-none transition-colors bg-rice-paper dark:bg-[#262630] text-text-primary dark:text-text-primary-dark focus:border-[#afada1] dark:focus:border-accent-dark"
          />
        </div>
      </div>
    </div>
  );
} 
