export interface DiaryEntry {
  id: string;
  content: string;
  weather: string;
  created_at: string;
  nostr_id?: string;
  day: string; // YYYY-MM-DD format
}

export interface LuXunDiaryEntry {
  date: string;
  content: string;
}

export type ViewMode = "write" | "view"; 

export interface CommonDiaryItem {
  title?: string;
  content: string;
  iso_date?: string;
  date_raw?: string;
  weather?: string;
  tags?: string[];
}

export interface CommonDiary {
  author: string;
  title?: string;
  count: number;
  items: CommonDiaryItem[];
}

export interface FriendDiaryEntry {
  date: string;
  content: string;
  id: string;
  weather?: string;
}

export interface FriendDiary {
  name: string;
  pubkey: string;
  entries: FriendDiaryEntry[];
} 

export interface UnwrappedGiftResponse {
  sender_pubkey: string;
  gift_wrap_event: string;
}

export interface UnwrappedGift {
  sender_pubkey: string;
  rumor: {
    id: string;
    pubkey: string;
    created_at: string;
    kind: number;
    tags: string[][];
    content: string;
  };
}

export function toUnwrappedGift(unwrappedGiftResponse: UnwrappedGiftResponse): UnwrappedGift {
  return {
    sender_pubkey: unwrappedGiftResponse.sender_pubkey,
    rumor: JSON.parse(unwrappedGiftResponse.gift_wrap_event),
  };
}
