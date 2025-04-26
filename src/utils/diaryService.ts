import { invoke } from "@tauri-apps/api/core";
import { DiaryEntry, LuXunDiaryEntry, CommonDiary } from "../types";
import luxunDiaries from '../assets/luxun-full-diary.json';

export async function loadNostrPublicKey(): Promise<string> {
  try {
    return await invoke<string>("get_nostr_public_key");
  } catch (error) {
    console.error("Failed to load Nostr public key:", error);
    throw error;
  }
}

export async function loadEntries(): Promise<DiaryEntry[]> {
  try {
    return await invoke<DiaryEntry[]>("get_diary_entries");
  } catch (error) {
    console.error("Failed to load entries:", error);
    throw error;
  }
}

export async function checkDayHasEntry(day: string): Promise<boolean> {
  try {
    return await invoke<boolean>("check_day_has_entry", { day });
  } catch (error) {
    console.error("Failed to check if day has entry:", error);
    throw error;
  }
}

export async function saveDiaryEntry(content: string, weather: string, day: string): Promise<DiaryEntry> {
  if (!content.trim()) {
    throw new Error("Content cannot be empty");
  }
  
  try {
    return await invoke<DiaryEntry>("save_diary_entry", { 
      content, 
      weather,
      day
    });
  } catch (error) {
    console.error("Failed to save entry:", error);
    throw error;
  }
}

export async function getNostrEvent(nostrId: string): Promise<string> {
  if (!nostrId) {
    throw new Error("Nostr ID cannot be empty");
  }
  
  try {
    return await invoke<string>("get_nostr_event", { nostrId });
  } catch (error) {
    console.error("Failed to load Nostr event:", error);
    throw error;
  }
}

export async function verifyNostrSignature(nostrId: string): Promise<boolean> {
  if (!nostrId) {
    throw new Error("Nostr ID cannot be empty");
  }
  
  try {
    return await invoke<boolean>("verify_nostr_signature", { nostrId });
  } catch (error) {
    console.error("Failed to verify Nostr signature:", error);
    throw error;
  }
}

export async function getRandomLuXunDiaryEntry(): Promise<LuXunDiaryEntry | null> {
  try {
    if (luxunDiaries && luxunDiaries.length > 0) {
      const randomIndex = Math.floor(Math.random() * luxunDiaries.length);
      return luxunDiaries[randomIndex];
    }
    return null;
  } catch (error) {
    console.error("Failed to load Lu Xun diary entry:", error);
    return null;
  }
}

export async function loadCommonDiaries(): Promise<CommonDiary[]> {
  try {
    return await invoke<CommonDiary[]>("list_common_diaries");
  } catch (error) {
    console.error("Failed to load common diaries:", error);
    throw error;
  }
}

export async function refreshCommonDiariesCache(): Promise<void> {
  try {
    await invoke<void>("refresh_common_diaries_cache");
    console.log("Common diaries cache refreshed successfully");
  } catch (error) {
    console.error("Failed to refresh common diaries cache:", error);
    throw error;
  }
}

export async function getCommonDiariesCacheStatus(): Promise<string> {
  try {
    return await invoke<string>("get_common_diaries_cache_status");
  } catch (error) {
    console.error("Failed to get common diaries cache status:", error);
    throw error;
  }
} 
