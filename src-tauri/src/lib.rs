// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use ::hex;
use chrono::{DateTime, TimeZone, Utc};
use directories::ProjectDirs;
use nostr_sdk::{Event, EventBuilder, Keys, Kind, SecretKey, Tag};
use once_cell::sync::Lazy;
use rusqlite::{params, Connection, OptionalExtension, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;
// Additional imports for GitHub API access
use reqwest;

fn get_data_dir() -> PathBuf {
    let proj_dirs =
        ProjectDirs::from("com", "luxun", "diary").expect("Failed to get project directories");

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

fn get_common_diaries_dir() -> PathBuf {
    let data_dir = get_data_dir();
    let common_diaries_dir = data_dir.join("common_diaries");
    fs::create_dir_all(&common_diaries_dir).expect("Failed to create common diaries directory");
    println!("Common diaries directory: {}", common_diaries_dir.display());
    common_diaries_dir
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

    // Create the common diaries cache table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS common_diaries_cache (
            author TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            last_modified TEXT NOT NULL
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
        Ok(stored_keys) => match hex::decode(&stored_keys.private_key_hex) {
            Ok(bytes) => match SecretKey::from_slice(&bytes) {
                Ok(secret_key) => {
                    let keys = Keys::new(secret_key);
                    println!("Loaded existing Nostr keys");
                    Some(keys)
                }
                Err(e) => {
                    println!("Failed to create secret key: {}", e);
                    None
                }
            },
            Err(e) => {
                println!("Failed to decode hex: {}", e);
                None
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

    // Convert the secret key to hex string for storage
    let secret_key = keys.secret_key();
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
        }
        Err(e) => Err(format!("Failed to write nostr keys: {}", e)),
    }
}

// Since sign() returns a Future, we need to make this function async
async fn create_nostr_event(
    keys: &Keys,
    content: &str,
    weather: &str,
    day: &str,
) -> Result<(String, String), String> {
    // Create tags
    let d_tag = Tag::parse(vec!["d".to_string(), day.to_string()])
        .map_err(|e| format!("Failed to create d tag: {}", e))?;

    let weather_tag = Tag::parse(vec!["weather".to_string(), weather.to_string()])
        .map_err(|e| format!("Failed to create weather tag: {}", e))?;

    // Create event builder with content and kind and add tags
    // Use method chaining to avoid ownership issues
    let event = EventBuilder::new(Kind::from(30027), content)
        .tags(vec![d_tag, weather_tag])
        .sign(keys)
        .await
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
async fn save_diary_entry(
    store: State<'_, Arc<DiaryStore>>,
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

    // Create Nostr event - use await
    let (nostr_id, nostr_event_json) =
        create_nostr_event(&keys, &content, &weather, &entry_day).await?;

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
    let existing: Option<String> = conn
        .query_row(
            "SELECT id FROM diary_entries WHERE day = ?1",
            params![entry.day],
            |row| row.get(0),
        )
        .optional()?;

    if let Some(existing_id) = existing {
        if existing_id != entry.id {
            return Err(rusqlite::Error::InvalidParameterName(format!(
                "An entry already exists for day: {}",
                entry.day
            )));
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
         ORDER BY created_at DESC",
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
    )
    .optional()
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

#[tauri::command]
fn verify_nostr_signature(nostr_id: String) -> Result<bool, String> {
    // Get the event JSON from the database
    let event_json = match get_nostr_event_from_db(&nostr_id) {
        Ok(Some(json)) => json,
        Ok(None) => return Err(format!("Nostr event with ID {} not found", nostr_id)),
        Err(e) => return Err(format!("Failed to get Nostr event: {}", e)),
    };

    // Parse the event JSON
    let event: Event = match serde_json::from_str(&event_json) {
        Ok(event) => event,
        Err(e) => return Err(format!("Failed to parse Nostr event: {}", e)),
    };

    // Verify the signature
    match event.verify() {
        Ok(()) => Ok(true), // If verify() returns Ok(()), the signature is valid
        Err(e) => Err(format!("Error verifying signature: {}", e)),
    }
}

// Common Diary structures based on the format specification
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CommonDiaryItem {
    title: Option<String>,
    content: String,
    iso_date: Option<String>,
    date_raw: Option<String>,
    weather: Option<String>,
    tags: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CommonDiary {
    author: String,
    title: Option<String>,
    count: u32,
    items: Vec<CommonDiaryItem>,
}

// Function to list all common diary files
fn list_common_diary_files() -> Result<Vec<PathBuf>, String> {
    let common_diaries_dir = get_common_diaries_dir();
    
    match fs::read_dir(&common_diaries_dir) {
        Ok(entries) => {
            let files: Vec<PathBuf> = entries
                .filter_map(|entry| {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("json") {
                            Some(path)
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                })
                .collect();
            Ok(files)
        },
        Err(e) => Err(format!("Failed to read common diaries directory: {}", e)),
    }
}

// Function to load a common diary from a file
fn load_common_diary(file_path: &PathBuf) -> Result<CommonDiary, String> {
    let mut file = match File::open(file_path) {
        Ok(file) => file,
        Err(e) => return Err(format!("Failed to open common diary file: {}", e)),
    };

    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        return Err(format!("Failed to read common diary file: {}", e));
    }

    match serde_json::from_str::<CommonDiary>(&contents) {
        Ok(diary) => Ok(diary),
        Err(e) => Err(format!("Failed to parse common diary file: {}", e)),
    }
}

// Function to save a common diary to cache
fn save_common_diary_to_cache(diary: &CommonDiary) -> SqlResult<()> {
    let conn = DB_CONNECTION.lock().unwrap();
    let data = serde_json::to_string(&diary).unwrap();
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT OR REPLACE INTO common_diaries_cache (author, data, last_modified) VALUES (?1, ?2, ?3)",
        params![diary.author, data, now]
    )?;
    
    println!("Saved diary with author '{}' to cache", diary.author);
    Ok(())
}

// Function to load all common diaries from cache
fn load_all_common_diaries_from_cache() -> SqlResult<Vec<CommonDiary>> {
    let conn = DB_CONNECTION.lock().unwrap();
    let mut stmt = conn.prepare("SELECT data FROM common_diaries_cache")?;
    
    let diaries_iter = stmt.query_map([], |row| {
        let data: String = row.get(0)?;
        match serde_json::from_str::<CommonDiary>(&data) {
            Ok(diary) => Ok(diary),
            Err(e) => {
                println!("Error parsing cached diary: {}", e);
                Err(rusqlite::Error::InvalidQuery)
            }
        }
    })?;
    
    let mut diaries = Vec::new();
    for diary_result in diaries_iter {
        match diary_result {
            Ok(diary) => diaries.push(diary),
            Err(e) => println!("Error retrieving diary from cache: {}", e),
        }
    }
    
    println!("Loaded {} diaries from cache", diaries.len());
    Ok(diaries)
}

// Function to check if cache is up to date by comparing file modification times
fn is_cache_up_to_date() -> bool {
    // Get list of diary files
    match list_common_diary_files() {
        Ok(files) => {
            // Check if we have any files at all
            if files.is_empty() {
                return true; // No files to process, cache is "up to date"
            }
            
            // Store the file count for later
            let file_count = files.len();
            
            // Get the latest modification time from the database
            let conn = DB_CONNECTION.lock().unwrap();
            let latest_mod_time: Result<Option<String>, rusqlite::Error> = conn.query_row(
                "SELECT MAX(last_modified) FROM common_diaries_cache",
                [],
                |row| row.get(0)
            );
            
            // If we don't have any cached entries, cache is not up to date
            let latest_mod_time = match latest_mod_time {
                Ok(Some(time)) => time,
                _ => return false,
            };
            
            // Parse the time
            let cache_time = match DateTime::parse_from_rfc3339(&latest_mod_time) {
                Ok(time) => time.with_timezone(&Utc),
                Err(_) => return false,
            };
            
            // Check if any file is newer than our cache
            for file_path in files {
                if let Ok(metadata) = fs::metadata(&file_path) {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(file_time) = modified.duration_since(std::time::UNIX_EPOCH) {
                            let file_datetime = Utc.timestamp_opt(
                                file_time.as_secs() as i64, 
                                file_time.subsec_nanos()
                            ).unwrap();
                            
                            // If file is newer than cache, cache is not up to date
                            if file_datetime > cache_time {
                                println!("File {} is newer than cache", file_path.display());
                                return false;
                            }
                        }
                    }
                }
            }
            
            // Also check if we have the same number of diaries in cache as files
            let count: i64 = match conn.query_row(
                "SELECT COUNT(*) FROM common_diaries_cache",
                [],
                |row| row.get(0)
            ) {
                Ok(count) => count,
                Err(_) => return false,
            };
            
            if count as usize != file_count {
                println!("Number of cached diaries ({}) differs from number of files ({})", count, file_count);
                return false;
            }
            
            true
        },
        Err(e) => {
            println!("Error listing diary files: {}", e);
            false
        }
    }
}

// Function to clear the common diaries cache
fn clear_common_diaries_cache() -> SqlResult<()> {
    let conn = DB_CONNECTION.lock().unwrap();
    conn.execute("DELETE FROM common_diaries_cache", [])?;
    println!("Common diaries cache cleared");
    Ok(())
}

// Function to list all available common diaries
#[tauri::command]
fn list_common_diaries() -> Result<Vec<CommonDiary>, String> {
    // First check if our cache is up to date
    if is_cache_up_to_date() {
        // Try to load from cache
        match load_all_common_diaries_from_cache() {
            Ok(diaries) if !diaries.is_empty() => {
                println!("Returning {} common diaries from SQLite cache", diaries.len());
                return Ok(diaries);
            }
            _ => {
                println!("Cache check indicated up-to-date but got empty result, reloading from files");
            }
        }
    }
    
    // If cache is not up to date or got empty results, load from files
    println!("Loading common diaries from files");
    let files = list_common_diary_files()?;
    
    let mut diaries = Vec::new();
    for file_path in files {
        match load_common_diary(&file_path) {
            Ok(diary) => {
                // Save to cache
                if let Err(e) = save_common_diary_to_cache(&diary) {
                    println!("Failed to save diary to cache: {}", e);
                }
                diaries.push(diary);
            }
            Err(e) => println!("Failed to load common diary from {}: {}", file_path.display(), e),
        }
    }
    
    println!("Loaded and cached {} common diaries from files", diaries.len());
    Ok(diaries)
}

// Function to get the common diaries directory path as a string
#[tauri::command]
fn get_common_diaries_dir_path() -> String {
    let dir = get_common_diaries_dir();
    dir.to_string_lossy().to_string()
}

// Function to refresh the common diaries cache
#[tauri::command]
fn refresh_common_diaries_cache() -> Result<(), String> {
    println!("Refreshing common diaries cache");
    
    // Clear existing cache
    match clear_common_diaries_cache() {
        Ok(_) => (),
        Err(e) => return Err(format!("Failed to clear common diaries cache: {}", e)),
    }
    
    // Reload files and rebuild cache
    println!("Reloading common diaries from files");
    let files = list_common_diary_files()?;
    
    let mut diary_count = 0;
    for file_path in files {
        match load_common_diary(&file_path) {
            Ok(diary) => {
                // Save to cache
                if let Err(e) = save_common_diary_to_cache(&diary) {
                    println!("Failed to save diary to cache: {}", e);
                } else {
                    diary_count += 1;
                }
            }
            Err(e) => println!("Failed to load common diary from {}: {}", file_path.display(), e),
        }
    }
    
    println!("Refreshed cache with {} common diaries from files", diary_count);
    Ok(())
}

#[tauri::command]
fn get_common_diaries_cache_status() -> Result<String, String> {
    let conn = DB_CONNECTION.lock().unwrap();
    
    // Count the number of cached diaries
    let count: i64 = match conn.query_row(
        "SELECT COUNT(*) FROM common_diaries_cache",
        [],
        |row| row.get(0)
    ) {
        Ok(count) => count,
        Err(e) => return Err(format!("Failed to count cached diaries: {}", e)),
    };
    
    // Get the latest modification time
    let latest_mod_time: Result<Option<String>, rusqlite::Error> = conn.query_row(
        "SELECT MAX(last_modified) FROM common_diaries_cache",
        [],
        |row| row.get(0)
    );
    
    let latest_mod_time = match latest_mod_time {
        Ok(Some(time)) => {
            // Parse the full timestamp into a more readable format
            match DateTime::parse_from_rfc3339(&time) {
                Ok(dt) => dt.format("%Y-%m-%d %H:%M:%S").to_string(),
                Err(_) => time
            }
        },
        Ok(None) => "未缓存".to_string(),
        Err(e) => return Err(format!("Failed to get latest modification time: {}", e)),
    };
    
    // Count the actual files in directory for comparison
    let file_count = match list_common_diary_files() {
        Ok(files) => files.len() as i64,
        Err(_) => -1,
    };
    
    // Create a more informative status message
    let status = if count == 0 {
        if file_count > 0 {
            format!("有 {} 个日记文件需要缓存，但当前缓存为空", file_count)
        } else if file_count == 0 {
            "日记目录中没有文件，缓存为空".to_string()
        } else {
            "缓存为空，无法读取日记目录".to_string()
        }
    } else if count == file_count {
        format!("缓存完整：已缓存 {} 个日记文件，最后更新于 {}", count, latest_mod_time)
    } else {
        format!("缓存不完整：已缓存 {} 个日记文件，目录中有 {} 个文件，最后更新于 {}", 
               count, file_count, latest_mod_time)
    };
    
    Ok(status)
}

#[tauri::command]
async fn download_common_diaries() -> Result<(), String> {
    println!("Downloading common diaries from GitHub");
    
    // 获取名人日记目录
    let target_dir = get_common_diaries_dir();
    
    // 从GitHub原始内容URL下载文件
    let base_url = "https://raw.githubusercontent.com/RetricSu/luxun-dairy/master/common-diary";
    let diaries = ["luxun_common_diary.json", "dongpo_zhilin_common_diary.json", "xuxiake_travel_common_diary.json"];
    
    // 下载每个文件
    for diary_name in diaries.iter() {
        let file_url = format!("{}/{}", base_url, diary_name);
        println!("Downloading {}", file_url);
        
        // 创建目标文件路径
        let target_path = target_dir.join(diary_name);
        
        // 下载文件
        match download_file(&file_url, &target_path).await {
            Ok(_) => println!("Successfully downloaded {}", diary_name),
            Err(e) => println!("Failed to download {}: {}", diary_name, e),
        }
    }
    
    // 刷新缓存
    refresh_common_diaries_cache()?;
    
    println!("Common diaries downloaded successfully");
    Ok(())
}

// 辅助函数：下载单个文件
async fn download_file(url: &str, target_path: &PathBuf) -> Result<(), String> {
    // 获取文件内容
    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("Failed to download file: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Failed to download file, status: {}", response.status()));
    }
    
    let content = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response content: {}", e))?;
    
    // 保存文件
    std::fs::write(target_path, content)
        .map_err(|e| format!("Failed to save file: {}", e))?;
    
    Ok(())
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
        .plugin(tauri_plugin_http::init())
        .manage(diary_store)
        .invoke_handler(tauri::generate_handler![
            greet,
            save_diary_entry,
            get_diary_entries,
            get_nostr_event,
            get_nostr_public_key,
            check_day_has_entry,
            verify_nostr_signature,
            list_common_diaries,
            get_common_diaries_dir_path,
            refresh_common_diaries_cache,
            get_common_diaries_cache_status,
            download_common_diaries,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
