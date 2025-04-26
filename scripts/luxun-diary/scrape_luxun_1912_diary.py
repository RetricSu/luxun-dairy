import requests
from bs4 import BeautifulSoup
import re
import json
import os

# URL of the Lu Xun diary
URL = "https://zh.wikisource.org/zh-hans/%E9%AD%AF%E8%BF%85%E6%97%A5%E8%A8%98/%E5%A3%AC%E5%AD%90%E6%97%A5%E8%A8%98"

# Define the structure for our CommonDiaryItem
class CommonDiaryItem:
    def __init__(self, content, iso_date=None, date_raw=None, weather=None, title=None, tags=None):
        self.title = title
        self.content = content
        self.iso_date = iso_date
        self.date_raw = date_raw
        self.weather = weather
        self.tags = tags if tags else []
    
    def to_dict(self):
        result = {"content": self.content}
        if self.title:
            result["title"] = self.title
        if self.iso_date:
            result["iso_date"] = self.iso_date
        if self.date_raw:
            result["date_raw"] = self.date_raw
        if self.weather:
            result["weather"] = self.weather
        if self.tags:
            result["tags"] = self.tags
        return result

def extract_weather(content):
    """Extract weather information from the diary entry"""
    weather_patterns = [
        r'晴[。，]', r'雨[。，]', r'阴[。，]', r'雪[。，]', r'风[。，]',
        r'晴，.*?风', r'昙', r'大雨', r'小雨', r'暴雨', r'大雪', r'微雪', r'大风'
    ]
    
    for pattern in weather_patterns:
        match = re.search(pattern, content)
        if match:
            weather = match.group(0).rstrip('。，')
            return weather
    return None

def scrape_luxun_diary():
    print("Fetching webpage...")
    
    # Fetch the webpage content
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(URL, headers=headers)
    response.encoding = 'utf-8'
    
    # Parse the HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Save a local copy for inspection if needed
    with open("luxun_diary.html", "w", encoding="utf-8") as f:
        f.write(soup.prettify())
    
    # Find all paragraphs that might contain diary entries
    paragraphs = soup.find_all('p')
    print(f"Found {len(paragraphs)} paragraphs")
    
    all_entries = []
    
    # Process each paragraph to extract entries
    for p in paragraphs:
        text = p.get_text()
        if "　　" in text:  # Check for double Chinese space which indicates entries
            pattern = re.compile(r'　　([一二三四五六七八九十]+日)(.*?)(?=　　[一二三四五六七八九十]+日|$)', re.DOTALL)
            matches = pattern.findall(text)
            if matches:
                all_entries.extend(matches)
    
    print(f"Found {len(all_entries)} total diary entries")
    
    # Instead of fixed index ranges, let's try to detect month transitions by looking at the day numbers
    all_diary_items = []
    entry_index_by_date = {}
    
    # First, convert all days to numbers
    day_numbers = []
    for idx, (day, _) in enumerate(all_entries):
        day_numbers.append(convert_day_to_number(day))
    
    # Detect month transitions by looking for sequences like 30->1, 31->1, or decreasing day numbers
    current_month = 5  # Start with May
    current_month_name = "五月"
    month_changes = []
    
    # Create a mapping for month names
    month_names = {
        5: "五月", 6: "六月", 7: "七月", 8: "八月", 
        9: "九月", 10: "十月", 11: "十一月", 12: "十二月"
    }
    
    for i in range(1, len(day_numbers)):
        prev_day = day_numbers[i-1]
        current_day = day_numbers[i]
        
        # If current day is much smaller than previous day, it likely indicates a month change
        if (prev_day >= 28 and current_day <= 3) or (prev_day - current_day > 15):
            month_changes.append(i)
            current_month += 1
            if current_month > 12:
                current_month = 1  # Wrap around to January if needed
    
    # Assign months based on detected transitions
    current_month = 5  # Start with May
    change_idx = 0
    
    for idx, (day, content) in enumerate(all_entries):
        # Check if we need to change months
        if change_idx < len(month_changes) and idx == month_changes[change_idx]:
            current_month += 1
            change_idx += 1
            print(f"Month change detected at entry {idx}: now {month_names[current_month]}")
        
        day_num = convert_day_to_number(day)
        
        # Validate day number for the month
        max_days = get_max_days_in_month(current_month)
        if day_num > max_days:
            print(f"WARNING: Invalid day {day_num} for month {month_names[current_month]} in entry {idx}")
            day_num = max_days  # Use the last day of the month as fallback
        
        # Create ISO date
        iso_date = f"1912-{current_month:02d}-{day_num:02d}"
        
        # Store entry index by date for debugging duplicates
        if iso_date in entry_index_by_date:
            entry_index_by_date[iso_date].append(idx)
        else:
            entry_index_by_date[iso_date] = [idx]
        
        # Create raw date
        date_raw = f"一九一二年{month_names[current_month]}{day}"
        
        # Extract weather if present
        weather = extract_weather(content)
        
        # Create diary item
        diary_item = CommonDiaryItem(
            content=f"{day} {content.strip()}",
            iso_date=iso_date,
            date_raw=date_raw,
            weather=weather,
            tags=["壬子日记"]
        )
        all_diary_items.append(diary_item)
    
    print(f"Successfully processed {len(all_diary_items)} diary entries")
    
    # Check for duplicate dates with improved debugging info
    iso_dates = {}
    for item in all_diary_items:
        if item.iso_date in iso_dates:
            indices = entry_index_by_date[item.iso_date]
            print(f"WARNING: Duplicate date found: {item.iso_date}, at indices {indices}")
            iso_dates[item.iso_date].append(item.content[:50] + "...")  # Show beginning of content
        else:
            iso_dates[item.iso_date] = [item.content[:50] + "..."]
    
    # Group entries by month for reporting
    months_count = {}
    for item in all_diary_items:
        month = item.date_raw.split("月")[0] + "月"
        if month in months_count:
            months_count[month] += 1
        else:
            months_count[month] = 1
    
    for month, count in sorted(months_count.items()):
        print(f"  {month}: {count} entries")
    
    return all_diary_items

def convert_day_to_number(day_text):
    """Convert traditional Chinese day to number"""
    # Map Chinese numerals to digits
    numeral_map = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
        '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
        '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
        '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
        '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
        '三十一': 31
    }
    
    # Remove "日" character
    day_text = day_text.replace('日', '')
    
    # Return the number or default to 1
    return numeral_map.get(day_text, 1)

def get_max_days_in_month(month):
    """Get the maximum number of days in a month for 1912 (leap year)"""
    days_in_month = {
        1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
        7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
    }
    return days_in_month.get(month, 30)  # Default to 30 if unknown

def save_common_diary_json(items):
    """Save all entries as a single CommonDiary JSON file"""
    common_diary = {
        "author": "鲁迅",
        "title": "壬子日记",
        "count": len(items),
        "items": [item.to_dict() for item in items]
    }
    
    # Create output directory if it doesn't exist
    os.makedirs("output", exist_ok=True)
    
    # Save as a single JSON file
    output_file = "output/luxun_renzi_diary.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(common_diary, f, ensure_ascii=False, indent=2)
    
    print(f"Saved combined diary to {output_file}")
    
    # Save individual diary entries
    individual_dir = "output/individual_entries"
    os.makedirs(individual_dir, exist_ok=True)
    
    # Track which dates have been saved already
    saved_dates = {}
    
    for i, item in enumerate(items):
        # Create a filename with date if available, otherwise use index
        if item.iso_date:
            # Check if this date has already been saved
            if item.iso_date in saved_dates:
                saved_dates[item.iso_date] += 1
                filename = f"{individual_dir}/luxun_{item.iso_date}_{saved_dates[item.iso_date]}.json"
                print(f"Warning: Adding duplicate entry for date {item.iso_date}")
            else:
                saved_dates[item.iso_date] = 1
                filename = f"{individual_dir}/luxun_{item.iso_date}.json"
        else:
            filename = f"{individual_dir}/luxun_entry_{i+1}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(item.to_dict(), f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(items)} individual diary entries to {individual_dir}/")

if __name__ == "__main__":
    print("Starting to scrape Lu Xun's diary...")
    diary_items = scrape_luxun_diary()
    save_common_diary_json(diary_items)
    print("Scraping completed successfully!") 
