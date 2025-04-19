import { invoke } from "@tauri-apps/api/core";
import { DiaryEntry } from "../types";

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
