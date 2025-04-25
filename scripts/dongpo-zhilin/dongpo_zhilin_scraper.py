import requests
from bs4 import BeautifulSoup
import json
import re
import os
import sys
from time import sleep

def clean_text(text):
    """Clean the text by removing unnecessary whitespace and line breaks"""
    if text is None:
        return ""
    # Replace multiple spaces, new lines and tabs with a single space
    text = re.sub(r'\s+', ' ', text.strip())
    return text

def scrape_dongpo_zhilin(url, volume_number):
    """Scrape the Dongpo Zhilin content from the given URL"""
    print(f"Scraping content from {url}...")
    
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        response.encoding = 'utf-8'  # Ensure correct encoding
        
        # Check if the request was successful
        if response.status_code != 200:
            print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
            return None
        
        # Parse the HTML content
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract the title
        title = f"东坡志林/卷{volume_number}"  # Default title
        page_title = soup.find('h1', {'id': 'firstHeading'})
        if page_title:
            title = page_title.get_text(strip=True)
        
        # Initialize the dictionary to store the scraped data
        dongpo_zhilin_data = {
            "title": title,
            "volume": volume_number,
            "chapters": []
        }
        
        # Find the main content div
        mw_content = soup.find('div', class_='mw-parser-output')
        if not mw_content:
            print("Could not find the main content div.")
            return None
        
        # Process each chapter (main section)
        current_chapter = None
        current_section = None
        
        # Loop through all elements in the content
        for element in mw_content.find_all(['h2', 'h3', 'p']):
            # Handle main chapter headers (h2)
            if element.name == 'h2':
                chapter_title = element.get_text(strip=True)
                chapter_title = re.sub(r'\[编辑\]', '', chapter_title).strip()
                
                # Skip non-content chapters like "目录"
                if chapter_title and chapter_title != "目录":
                    current_chapter = {
                        "title": chapter_title,
                        "sections": []
                    }
                    dongpo_zhilin_data["chapters"].append(current_chapter)
                    current_section = None
            
            # Handle section headers (h3)
            elif element.name == 'h3' and current_chapter is not None:
                section_title = element.get_text(strip=True)
                section_title = re.sub(r'\[编辑\]', '', section_title).strip()
                
                if section_title:
                    current_section = {
                        "title": section_title,
                        "content": ""
                    }
                    current_chapter["sections"].append(current_section)
            
            # Handle content paragraphs
            elif element.name == 'p' and current_section is not None:
                content = element.get_text(strip=True)
                if content:
                    # Add space if there's already content
                    if current_section["content"]:
                        current_section["content"] += " "
                    current_section["content"] += content
        
        # Clean up the final data
        for chapter in dongpo_zhilin_data["chapters"]:
            for section in chapter["sections"]:
                section["content"] = clean_text(section["content"])
        
        return dongpo_zhilin_data
    
    except Exception as e:
        print(f"An error occurred while scraping: {str(e)}")
        return None

def save_to_json(data, volume_number):
    """Save the scraped data to a JSON file"""
    filename = f"dongpo_zhilin_vol{volume_number}.json"
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Data successfully saved to {filename}")
        return True
    except Exception as e:
        print(f"Error saving to JSON: {str(e)}")
        return False

def get_url_for_volume(volume_number):
    """Generate the URL for a specific volume of Dongpo Zhilin"""
    volume_chinese = {
        "1": "一",
        "2": "二",
        "3": "三",
        "4": "四",
        "5": "五",
        "6": "六"
    }
    
    # Convert volume number to Chinese character
    if str(volume_number) in volume_chinese:
        chinese_num = volume_chinese[str(volume_number)]
    else:
        raise ValueError(f"Volume number {volume_number} is not supported")
    
    # Construct the URL
    url = f"https://zh.wikisource.org/zh-hans/%E6%9D%B1%E5%9D%A1%E5%BF%97%E6%9E%97/%E5%8D%B7{chinese_num}"
    return url

if __name__ == "__main__":
    if len(sys.argv) > 1:
        volume_number = sys.argv[1]
    else:
        volume_number = input("Please enter the volume number (1-6) to scrape: ")
    
    try:
        volume = int(volume_number)
        if volume < 1 or volume > 6:
            print("Volume number must be between 1 and 6.")
            sys.exit(1)
        
        url = get_url_for_volume(volume)
        print(f"Starting to scrape 东坡志林/卷{volume_number}...")
        dongpo_data = scrape_dongpo_zhilin(url, volume_number)
        
        if dongpo_data:
            if save_to_json(dongpo_data, volume_number):
                print(f"Successfully scraped {len(dongpo_data['chapters'])} chapters with a total of {sum(len(chapter['sections']) for chapter in dongpo_data['chapters'])} sections.")
            else:
                print("Failed to save the data to JSON.")
        else:
            print("Failed to scrape the data.")
    except ValueError as e:
        print(f"Error: {str(e)}")
        sys.exit(1) 
