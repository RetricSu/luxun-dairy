import { shortenKey } from "../utils/helpers";

interface SettingsPanelProps {
  nostrPublicKey: string;
  selectedDay: string;
  handleDayChange: (e: Event) => void;
}

export function SettingsPanel({ nostrPublicKey, selectedDay, handleDayChange }: SettingsPanelProps) {
  return (
    <div className="bg-rice-paper dark:bg-[#1a1a1e] border border-border-light dark:border-border-dark rounded-md p-5 mb-6">
      {nostrPublicKey && (
        <div className="flex items-center mb-3">
          <span className="font-medium text-text-secondary dark:text-text-secondary-dark w-[150px]">Nostr 公钥:</span>
          <span className="font-mono p-1 px-2 bg-[#f0f0eb] dark:bg-[#262630] rounded text-[#5f5e56] dark:text-text-primary-dark" title={nostrPublicKey}>
            {shortenKey(nostrPublicKey)}
          </span>
        </div>
      )}
      
      <div className="flex items-center">
        <span className="font-medium text-text-secondary dark:text-text-secondary-dark w-[150px]">日期选择:</span>
        <input
          type="date"
          value={selectedDay}
          onChange={handleDayChange}
          className="font-inherit p-2 px-3 rounded border border-border-light dark:border-border-dark text-sm outline-none transition-colors bg-rice-paper dark:bg-[#262630] text-text-primary dark:text-text-primary-dark focus:border-[#afada1] dark:focus:border-accent-dark"
        />
      </div>
    </div>
  );
} 
