// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use chrono::{DateTime, Utc};
use directories::ProjectDirs;
use nostr_sdk::{EventBuilder, Keys, Kind, Tag};
use rusqlite::{params, Connection, Result as SqlResult, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;
use hex;
use once_cell::sync::Lazy;

fn get_data_dir() -> PathBuf {
    let proj_dirs = ProjectDirs::from("com", "luxun", "diary")
        .expect("Failed to get project directories");
    
    let data_dir = proj_dirs.data_dir();
    fs::create_dir_all(data_dir).expect("Failed to create data directory");
    println!("Data directory: {}", data_dir.display());
    data_dir.to_path_buf()
}

fn get_db_path() -> PathBuf {
    let data_dir = get_data_dir();
    data_dir.join("diary.db")
}

fn get_nostr_keys_file_path() -> PathBuf {
    get_data_dir().join("nostr_keys.json")
}

fn setup_db() -> SqlResult<Connection> {
    let db_path = get_db_path();
    println!("Database path: {}", db_path.display());
    
    let conn = Connection::open(db_path)?;
    
    // Create the diary entries table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS diary_entries (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            weather TEXT NOT NULL,
            created_at TEXT NOT NULL,
            nostr_id TEXT UNIQUE,
            day TEXT UNIQUE,
            nostr_event TEXT
        )",
        [],
    )?;
    
    Ok(conn)
}

static DB_CONNECTION: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let conn = setup_db().expect("Failed to set up database");
    Mutex::new(conn)
});

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiaryEntry {
    id: String,
    content: String,
    weather: String,
    created_at: DateTime<Utc>,
    nostr_id: Option<String>,
    day: String, // YYYY-MM-DD format
}

#[derive(Default)]
struct DiaryStore {
    nostr_keys: Mutex<Option<Keys>>,
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

// Using String for private key storage - hex encoded format
#[derive(Serialize, Deserialize)]
struct StoredKeys {
    private_key_hex: String,
}

fn load_nostr_keys() -> Option<Keys> {
    let file_path = get_nostr_keys_file_path();
    if !file_path.exists() {
        return None;
    }

    let mut file = match File::open(&file_path) {
        Ok(file) => file,
        Err(e) => {
            println!("Failed to open nostr keys file: {}", e);
            return None;
        }
    };
    
    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        println!("Failed to read nostr keys file: {}", e);
        return None;
    }

    match serde_json::from_str::<StoredKeys>(&contents) {
        Ok(stored_keys) => {
            // Using try-block to simplify error handling
            let result = || -> Option<Keys> {
                // Convert hex to bytes
                let bytes = hex::decode(&stored_keys.private_key_hex).ok()?;
                // Use the constructor new() with a SecretKey
                let secret_key = nostr_sdk::secp256k1::SecretKey::from_slice(&bytes).ok()?;
                Some(Keys::new(secret_key))
            }();
            
            match result {
                Some(keys) => {
                    println!("Loaded existing Nostr keys");
                    Some(keys)
                },
                None => {
                    println!("Failed to parse Nostr keys");
                    None
                }
            }
        },
        Err(e) => {
            println!("Failed to parse nostr keys file: {}", e);
            None
        }
    }
}

fn save_nostr_keys(keys: &Keys) -> Result<(), String> {
    let file_path = get_nostr_keys_file_path();
    
    // Get bytes from secret key
    let secret_key = keys.secret_key()
        .map_err(|e| format!("Failed to access secret key: {}", e))?;
    
    // Convert to hex string for storage
    let private_key_hex = hex::encode(secret_key.as_ref());
    
    let stored_keys = StoredKeys { private_key_hex };
    
    let json = match serde_json::to_string(&stored_keys) {
        Ok(json) => json,
        Err(e) => return Err(format!("Failed to serialize nostr keys: {}", e)),
    };
    
    let mut file = match File::create(&file_path) {
        Ok(file) => file,
        Err(e) => return Err(format!("Failed to create nostr keys file: {}", e)),
    };
    
    match file.write_all(json.as_bytes()) {
        Ok(_) => {
            println!("Successfully saved Nostr keys");
            Ok(())
        },
        Err(e) => Err(format!("Failed to write nostr keys: {}", e)),
    }
}

fn create_nostr_event(keys: &Keys, content: &str, weather: &str) -> Result<(String, String), String> {
    let event = EventBuilder::new(
        Kind::TextNote,
        format!("Diary Entry\nWeather: {}\n\n{}", weather, content),
        &[Tag::Identifier("diary".to_string())],
    )
    .to_event(keys)
    .map_err(|e| format!("Failed to create Nostr event: {}", e))?;
    
    let event_json = serde_json::to_string(&event)
        .map_err(|e| format!("Failed to serialize Nostr event: {}", e))?;
    
    Ok((event.id.to_string(), event_json))
}

fn get_or_create_nostr_keys(store: &Arc<DiaryStore>) -> Result<Keys, String> {
    let mut nostr_keys_guard = store.nostr_keys.lock().unwrap();
    
    if let Some(keys) = nostr_keys_guard.as_ref() {
        return Ok(keys.clone());
    }
    
    // Try to load existing keys
    if let Some(keys) = load_nostr_keys() {
        *nostr_keys_guard = Some(keys.clone());
        return Ok(keys);
    }
    
    // Generate new keys
    println!("Generating new Nostr keys");
    let keys = Keys::generate();
    
    // Save the keys
    save_nostr_keys(&keys)?;
    
    // Update the store
    *nostr_keys_guard = Some(keys.clone());
    
    Ok(keys)
}

#[tauri::command]
fn save_diary_entry(
    store: State<Arc<DiaryStore>>,
    content: String,
    weather: String,
    day: Option<String>,
) -> Result<DiaryEntry, String> {
    println!("Creating new diary entry with weather: {}", weather);
    
    // Use provided day or get current day
    let entry_day = day.unwrap_or_else(|| Utc::now().format("%Y-%m-%d").to_string());
    
    // Check if an entry already exists for this day
    match entry_exists_for_day(&entry_day) {
        Ok(exists) if exists => {
            return Err(format!("An entry already exists for day: {}", entry_day));
        }
        Err(e) => {
            return Err(format!("Failed to check if entry exists: {}", e));
        }
        _ => {}
    }
    
    // Get or create Nostr keys
    let keys = get_or_create_nostr_keys(&store)?;
    let pubkey_hex = keys.public_key().to_string();
    println!("Using Nostr public key: {}", pubkey_hex);
    
    // Create Nostr event
    let (nostr_id, nostr_event_json) = create_nostr_event(&keys, &content, &weather)?;
    
    let entry = DiaryEntry {
        id: Uuid::new_v4().to_string(),
        content,
        weather,
        created_at: Utc::now(),
        nostr_id: Some(nostr_id.clone()),
        day: entry_day,
    };
    
    println!("Generated diary entry with ID: {}", entry.id);
    
    // Save entry to database
    if let Err(e) = save_entry_to_db(&entry, &nostr_event_json) {
        return Err(format!("Failed to save entry to database: {}", e));
    }
    
    Ok(entry)
}

#[tauri::command]
fn get_diary_entries(_store: State<Arc<DiaryStore>>) -> Result<Vec<DiaryEntry>, String> {
    match load_entries_from_db() {
        Ok(entries) => Ok(entries),
        Err(e) => Err(format!("Failed to load entries from database: {}", e)),
    }
}

#[tauri::command]
fn get_nostr_event(nostr_id: String) -> Result<String, String> {
    match get_nostr_event_from_db(&nostr_id) {
        Ok(Some(event)) => Ok(event),
        Ok(None) => Err(format!("Nostr event with ID {} not found", nostr_id)),
        Err(e) => Err(format!("Failed to get Nostr event: {}", e)),
    }
}

#[tauri::command]
fn check_day_has_entry(day: String) -> Result<bool, String> {
    match entry_exists_for_day(&day) {
        Ok(exists) => Ok(exists),
        Err(e) => Err(format!("Failed to check if day has entry: {}", e)),
    }
}

#[tauri::command]
fn get_nostr_public_key(store: State<Arc<DiaryStore>>) -> Result<String, String> {
    let keys = get_or_create_nostr_keys(&store)?;
    Ok(keys.public_key().to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn save_entry_to_db(entry: &DiaryEntry, nostr_event_json: &str) -> SqlResult<()> {
    let conn = DB_CONNECTION.lock().unwrap();
    
    // Check if an entry already exists for this day
    let existing: Option<String> = conn.query_row(
        "SELECT id FROM diary_entries WHERE day = ?1",
        params![entry.day],
        |row| row.get(0),
    ).optional()?;
    
    if let Some(existing_id) = existing {
        if existing_id != entry.id {
            return Err(rusqlite::Error::InvalidParameterName(
                format!("An entry already exists for day: {}", entry.day)
            ));
        }
    }
    
    conn.execute(
        "INSERT OR REPLACE INTO diary_entries (id, content, weather, created_at, nostr_id, day, nostr_event)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            entry.id,
            entry.content,
            entry.weather,
            entry.created_at.to_rfc3339(),
            entry.nostr_id,
            entry.day,
            nostr_event_json
        ],
    )?;
    
    println!("Saved entry to database with ID: {}", entry.id);
    Ok(())
}

fn load_entries_from_db() -> SqlResult<Vec<DiaryEntry>> {
    let conn = DB_CONNECTION.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, content, weather, created_at, nostr_id, day FROM diary_entries 
         ORDER BY created_at DESC"
    )?;
    
    let entries_iter = stmt.query_map([], |row| {
        let created_at_str: String = row.get(3)?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now());
        
        Ok(DiaryEntry {
            id: row.get(0)?,
            content: row.get(1)?,
            weather: row.get(2)?,
            created_at,
            nostr_id: row.get(4)?,
            day: row.get(5)?,
        })
    })?;
    
    let mut entries = Vec::new();
    for entry_result in entries_iter {
        entries.push(entry_result?);
    }
    
    println!("Loaded {} entries from database", entries.len());
    Ok(entries)
}

fn get_nostr_event_from_db(nostr_id: &str) -> SqlResult<Option<String>> {
    let conn = DB_CONNECTION.lock().unwrap();
    conn.query_row(
        "SELECT nostr_event FROM diary_entries WHERE nostr_id = ?1",
        params![nostr_id],
        |row| row.get(0),
    ).optional()
}

fn entry_exists_for_day(day: &str) -> SqlResult<bool> {
    let conn = DB_CONNECTION.lock().unwrap();
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM diary_entries WHERE day = ?1",
        params![day],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("Starting Lu Xun's Diary application");
    
    // Initialize database
    Lazy::force(&DB_CONNECTION);
    println!("Database initialized");
    
    // Initialize diary store
    let diary_store = Arc::new(DiaryStore {
        nostr_keys: Mutex::new(None),
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(diary_store)
        .invoke_handler(tauri::generate_handler![
            greet,
            save_diary_entry,
            get_diary_entries,
            get_nostr_event,
            get_nostr_public_key,
            check_day_has_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
