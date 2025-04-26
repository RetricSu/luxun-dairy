#!/usr/bin/env python3
import json
import os
import glob
from pathlib import Path

# Define paths
script_dir = Path(__file__).parent
source_dir = script_dir / "scripts" / "luxun-diary"
target_file = script_dir / "common-diary" / "luxun_common_diary.json"

def merge_diaries():
    # Initialize target data structure
    target_data = {
        "author": "鲁迅",
        "title": "鲁迅日记",
        "items": []
    }
    
    # If target file exists, load it
    if target_file.exists():
        try:
            with open(target_file, 'r', encoding='utf-8') as f:
                target_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error: Could not decode {target_file}. Using empty structure.")
    
    # Get all source files
    source_files = glob.glob(str(source_dir / "luxun_*_diary.json"))
    
    # Merge items from all source files
    for file_path in source_files:
        print(f"Processing: {file_path}")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source_data = json.load(f)
                if "items" in source_data and isinstance(source_data["items"], list):
                    target_data["items"].extend(source_data["items"])
                    print(f"  Added {len(source_data['items'])} items")
                else:
                    print(f"  Warning: No items found in {file_path}")
        except Exception as e:
            print(f"  Error processing {file_path}: {e}")
    
    # Sort items by iso_date
    target_data["items"].sort(key=lambda x: x.get("iso_date", ""))
    
    # Update count
    target_data["count"] = len(target_data["items"])
    
    # Write merged data back to target file
    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(target_data, f, ensure_ascii=False, indent=2)
    
    print(f"Merged {len(target_data['items'])} items to {target_file}")
    print(f"Items sorted by iso_date")

if __name__ == "__main__":
    merge_diaries() 
