import requests
from bs4 import BeautifulSoup
import re
import json
import os

# URL of the Lu Xun diary for 1916
URL = "https://zh.wikisource.org/zh-hans/%E9%AD%AF%E8%BF%85%E6%97%A5%E8%A8%98/%E4%B8%99%E8%BE%B0%E6%97%A5%E8%A8%98"

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
        r'晴[。，]', r'雨[。，]', r'阴[。，]', r'陰[。，]', r'雪[。，]', r'風[。，]', r'风[。，]',
        r'晴，.*?風', r'晴，.*?风', r'曇', r'昙', r'大雨', r'小雨', r'暴雨', r'大雪', r'微雪', r'大風', r'大风'
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
    
    # Create a mapping of month names to month numbers
    month_map = {
        "正月": 1, "二月": 2, "三月": 3, "四月": 4, "五月": 5, "六月": 6,
        "七月": 7, "八月": 8, "九月": 9, "十月": 10, "十一月": 11, "十二月": 12
    }
    
    # Dictionary to store all diary entries
    all_diary_items = []
    
    # Find all month headings
    month_headings = soup.find_all("h2")
    print(f"Found {len(month_headings)} month headings")
    
    # Process each month
    for heading in month_headings:
        month_name = heading.get_text(strip=True)
        if month_name not in month_map:
            continue
            
        month_num = month_map[month_name]
        print(f"Processing month: {month_name} ({month_num})")
        
        # Initialize list for current month's entries
        month_entries = []
        
        # Get all the pre elements after this heading until the next heading
        content_elements = []
        next_sibling = heading.parent.next_sibling
        
        while next_sibling:
            if next_sibling.name == 'pre' or next_sibling.name == 'p':
                content_elements.append(next_sibling)
            elif next_sibling.name == 'div' and next_sibling.find('h2'):
                break
            next_sibling = next_sibling.next_sibling
        
        print(f"  Found {len(content_elements)} diary entry blocks")
        
        # Process all entries for this month
        current_day = 1
        for elem in content_elements:
            content = elem.get_text(strip=True)
            if not content:
                continue
                
            # Try to extract the day information
            day_match = re.search(r'^[\s　]*([一二三四五六七八九十]+日)', content)
            
            if day_match:
                day_text = day_match.group(1)
                current_day = convert_day_to_number(day_text)
                # Remove the day from the content since we'll add it back later
                content = content[content.index(day_text) + len(day_text):].strip()
            
            # Create ISO date
            iso_date = f"1916-{month_num:02d}-{current_day:02d}"
            
            # Create raw date
            day_text = get_chinese_number(current_day) + "日"
            date_raw = f"一九一六年{month_name}{day_text}"
            
            # Extract weather if present
            weather = extract_weather(content)
            
            # Create diary item
            entry_content = f"{day_text} {content}"
            diary_item = CommonDiaryItem(
                content=entry_content,
                iso_date=iso_date,
                date_raw=date_raw,
                weather=weather,
                tags=["丙辰日记"]
            )
            all_diary_items.append(diary_item)
            month_entries.append(diary_item)
        
        print(f"  Processed {len(month_entries)} entries for {month_name}")
    
    print(f"Successfully processed {len(all_diary_items)} diary entries")
    
    # Group entries by month for reporting
    months_count = {}
    for item in all_diary_items:
        month = item.date_raw.split("月")[0] + "月"
        if month in months_count:
            months_count[month] += 1
        else:
            months_count[month] = 1
    
    for month, count in sorted(months_count.items(), key=lambda x: month_map.get(x[0].replace("一九一六年", ""), 0)):
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

def get_chinese_number(num):
    """Convert Arabic numeral to Chinese numeral"""
    # Map digits to Chinese numerals
    numeral_map = {
        1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
        6: '六', 7: '七', 8: '八', 9: '九', 10: '十',
        20: '二十', 30: '三十'
    }
    
    if num <= 10:
        return numeral_map[num]
    elif num < 20:
        return f"十{numeral_map[num-10] if num > 11 else ''}"
    elif num % 10 == 0:
        return numeral_map[num]
    else:
        tens = num // 10 * 10
        ones = num % 10
        return f"{numeral_map[tens]}{numeral_map[ones]}"

def save_common_diary_json(items):
    """Save all entries as a single CommonDiary JSON file"""
    common_diary = {
        "author": "鲁迅",
        "title": "丙辰日记",
        "count": len(items),
        "items": [item.to_dict() for item in items]
    }
    
    # Create output directory if it doesn't exist
    os.makedirs("output_1916", exist_ok=True)
    
    # Save as a single JSON file
    output_file = "output_1916/luxun_bingchen_diary.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(common_diary, f, ensure_ascii=False, indent=2)
    
    print(f"Saved combined diary to {output_file}")
    
    # Save individual diary entries
    individual_dir = "output_1916/individual_entries"
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
    print("Starting to scrape Lu Xun's 1916 diary...")
    diary_items = scrape_luxun_diary()
    save_common_diary_json(diary_items)
    print("Scraping completed successfully!") 
