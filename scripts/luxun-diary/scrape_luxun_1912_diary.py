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
    
    # Manually assign entries to months based on knowledge from the file
    # The diary covers from May to December 1912
    month_boundaries = [
        # (start_idx, end_idx, month_name, month_number)
        (0, 31, "五月", 5),
        (32, 59, "六月", 6),
        (60, 85, "七月", 7),
        (86, 110, "八月", 8),
        (111, 140, "九月", 9),
        (141, 183, "十月", 10),
        (184, 204, "十一月", 11),
        (205, 236, "十二月", 12)  # Updated to include all remaining entries
    ]
    
    # Process entries with correct month assignment
    all_diary_items = []
    
    for idx, (day, content) in enumerate(all_entries):
        # Find which month this entry belongs to
        current_month = None
        current_month_num = None
        
        for start_idx, end_idx, month_name, month_num in month_boundaries:
            if start_idx <= idx <= end_idx:
                current_month = month_name
                current_month_num = month_num
                break
        
        if not current_month:
            print(f"WARNING: Could not determine month for entry {idx}: {day}")
            continue
        
        # Convert day to number
        day_num = convert_day_to_number(day)
        
        # Create ISO date
        iso_date = f"1912-{current_month_num:02d}-{day_num:02d}"
        
        # Create raw date
        date_raw = f"一九一二年{current_month}{day}"
        
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
    
    for i, item in enumerate(items):
        # Create a filename with date if available, otherwise use index
        if item.iso_date:
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
