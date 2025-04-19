// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use chrono::{DateTime, Utc};
use directories::ProjectDirs;
use nostr_sdk::{EventBuilder, Keys, Kind, Tag};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use std::{collections::HashMap, sync::Arc};
use tauri::State;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiaryEntry {
    id: String,
    content: String,
    weather: String,
    created_at: DateTime<Utc>,
    nostr_id: Option<String>,
}

#[derive(Default)]
struct DiaryStore {
    entries: Mutex<HashMap<String, DiaryEntry>>,
}

fn get_data_dir() -> PathBuf {
    let proj_dirs = ProjectDirs::from("com", "luxun", "diary")
        .expect("Failed to get project directories");
    let data_dir = proj_dirs.data_dir();
    fs::create_dir_all(data_dir).expect("Failed to create data directory");
    
    println!("Diary storage location: {}", data_dir.display());
    
    data_dir.to_path_buf()
}

fn get_entries_file_path() -> PathBuf {
    let path = get_data_dir().join("entries.json");
    println!("Entries file path: {}", path.display());
    path
}

fn get_nostr_events_dir() -> PathBuf {
    let dir = get_data_dir().join("nostr_events");
    fs::create_dir_all(&dir).expect("Failed to create nostr events directory");
    println!("Nostr events directory: {}", dir.display());
    dir
}

fn save_nostr_event(event_id: &str, event_json: &str) -> Result<(), String> {
    let file_path = get_nostr_events_dir().join(format!("{}.json", event_id));
    
    let mut file = match File::create(&file_path) {
        Ok(file) => file,
        Err(e) => return Err(format!("Failed to create nostr event file: {}", e)),
    };
    
    match file.write_all(event_json.as_bytes()) {
        Ok(_) => {
            println!("Saved Nostr event to: {}", file_path.display());
            Ok(())
        },
        Err(e) => Err(format!("Failed to write nostr event: {}", e)),
    }
}

fn load_entries() -> HashMap<String, DiaryEntry> {
    let file_path = get_entries_file_path();
    if !file_path.exists() {
        println!("No existing entries file found. Starting with empty entries.");
        return HashMap::new();
    }

    let mut file = match File::open(&file_path) {
        Ok(file) => file,
        Err(e) => {
            println!("Failed to open entries file: {}", e);
            return HashMap::new();
        }
    };
    
    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        println!("Failed to read entries file: {}", e);
        return HashMap::new();
    }

    match serde_json::from_str::<HashMap<String, DiaryEntry>>(&contents) {
        Ok(entries) => {
            let entry_count = entries.len();
            println!("Loaded {} diary entries from storage", entry_count);
            entries
        },
        Err(e) => {
            println!("Failed to parse entries file: {}", e);
            HashMap::new()
        }
    }
}

fn save_entries(entries: &HashMap<String, DiaryEntry>) -> Result<(), String> {
    let file_path = get_entries_file_path();
    
    let json = match serde_json::to_string_pretty(entries) {
        Ok(json) => json,
        Err(e) => return Err(format!("Failed to serialize entries: {}", e)),
    };
    
    let mut file = match File::create(&file_path) {
        Ok(file) => file,
        Err(e) => return Err(format!("Failed to create entries file: {}", e)),
    };
    
    match file.write_all(json.as_bytes()) {
        Ok(_) => {
            println!("Successfully saved {} diary entries to storage", entries.len());
            Ok(())
        },
        Err(e) => Err(format!("Failed to write entries: {}", e)),
    }
}

fn create_nostr_event(content: &str, weather: &str) -> (String, String) {
    let keys = Keys::generate();
    
    let event = EventBuilder::new(
        Kind::TextNote,
        format!("Diary Entry\nWeather: {}\n\n{}", weather, content),
        &[Tag::Identifier("diary".to_string())],
    )
    .to_event(&keys)
    .expect("Failed to create event");
    
    (event.id.to_string(), serde_json::to_string(&event).unwrap())
}

#[tauri::command]
fn save_diary_entry(
    store: State<Arc<DiaryStore>>,
    content: String,
    weather: String,
) -> Result<DiaryEntry, String> {
    println!("Creating new diary entry with weather: {}", weather);
    
    let (nostr_id, nostr_event_json) = create_nostr_event(&content, &weather);
    
    // Save the Nostr event to a file
    if let Err(e) = save_nostr_event(&nostr_id, &nostr_event_json) {
        println!("Warning: Failed to save Nostr event: {}", e);
        // Continue anyway, as we can still save the diary entry
    }
    
    let entry = DiaryEntry {
        id: Uuid::new_v4().to_string(),
        content,
        weather,
        created_at: Utc::now(),
        nostr_id: Some(nostr_id),
    };
    
    println!("Generated diary entry with ID: {}", entry.id);
    
    let entry_id = entry.id.clone();
    let mut entries = store.entries.lock().unwrap();
    entries.insert(entry_id, entry.clone());
    
    match save_entries(&entries) {
        Ok(_) => Ok(entry),
        Err(e) => Err(e),
    }
}

#[tauri::command]
fn get_diary_entries(store: State<Arc<DiaryStore>>) -> Vec<DiaryEntry> {
    let entries = store.entries.lock().unwrap();
    entries.values().cloned().collect()
}

#[tauri::command]
fn get_nostr_event(nostr_id: String) -> Result<String, String> {
    let file_path = get_nostr_events_dir().join(format!("{}.json", nostr_id));
    
    if !file_path.exists() {
        return Err(format!("Nostr event with ID {} not found", nostr_id));
    }
    
    let mut file = match File::open(&file_path) {
        Ok(file) => file,
        Err(e) => return Err(format!("Failed to open Nostr event file: {}", e)),
    };
    
    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        return Err(format!("Failed to read Nostr event file: {}", e));
    }
    
    Ok(contents)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("Starting Lu Xun's Diary application");
    
    let diary_store = Arc::new(DiaryStore {
        entries: Mutex::new(load_entries()),
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(diary_store)
        .invoke_handler(tauri::generate_handler![
            greet,
            save_diary_entry,
            get_diary_entries,
            get_nostr_event
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
