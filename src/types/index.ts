export interface DiaryEntry {
  id: string;
  content: string;
  weather: string;
  created_at: string;
  nostr_id?: string;
  day: string; // YYYY-MM-DD format
}

export type ViewMode = "write" | "view"; 
