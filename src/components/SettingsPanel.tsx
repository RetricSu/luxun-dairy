import { shortenKey } from "../utils/helpers";

interface SettingsPanelProps {
  nostrPublicKey: string;
  selectedDay: string;
  handleDayChange: (e: Event) => void;
}

export function SettingsPanel({ nostrPublicKey, selectedDay, handleDayChange }: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      {nostrPublicKey && (
        <div className="settings-item">
          <span className="settings-label">Nostr 公钥:</span>
          <span className="settings-value" title={nostrPublicKey}>
            {shortenKey(nostrPublicKey)}
          </span>
        </div>
      )}
      
      <div className="settings-item">
        <span className="settings-label">日期选择:</span>
        <input
          type="date"
          value={selectedDay}
          onChange={handleDayChange}
          className="date-input"
        />
      </div>
    </div>
  );
} 
