# 东坡志林 Web Scraper

This project contains Python scripts to scrape and extract the content of 《东坡志林》(Dongpo Zhilin) from Wikisource. The content is structured and saved as JSON files for easy consumption by applications.

## About 东坡志林

《东坡志林》is a collection of essays and notes written by Su Shi (苏轼, 1037-1101), also known as Su Dongpo, a renowned poet, writer, and artist of the Song Dynasty. The work contains his thoughts, observations, and anecdotes on various topics including philosophy, literature, art, and everyday life.

## Scripts

The repository contains the following scripts:

- `dongpo_zhilin_scraper.py` - Script to scrape a single volume of 东坡志林
- `scrape_all_dongpo_zhilin.py` - Script to scrape all volumes of 东坡志林 in one go

## Usage

### Scraping a single volume

```bash
python3 dongpo_zhilin_scraper.py [volume_number]
```

Where `[volume_number]` is a number between 1 and 6, representing the volume you want to scrape. If no volume number is provided, the script will prompt you to enter one.

Example:
```bash
python3 dongpo_zhilin_scraper.py 2
```

This will scrape Volume 2 of 东坡志林 and save it as `dongpo_zhilin_vol2.json`.

### Scraping all volumes

```bash
python3 scrape_all_dongpo_zhilin.py
```

This will scrape all 6 volumes of 东坡志林 sequentially and save them as separate JSON files.

## JSON Structure

The JSON output has the following structure:

```json
{
  "title": "东坡志林/卷一",
  "volume": "1",
  "chapters": [
    {
      "title": "记游",
      "sections": [
        {
          "title": "记过合浦",
          "content": "..."
        },
        ...
      ]
    },
    ...
  ]
}
```

- `title`: The title of the volume
- `volume`: The volume number
- `chapters`: An array of chapters in the volume
  - `title`: The title of the chapter
  - `sections`: An array of sections in the chapter
    - `title`: The title of the section
    - `content`: The text content of the section

## Requirements

- Python 3.6+
- Requests
- BeautifulSoup4

Install the required packages:

```bash
pip install requests beautifulsoup4
```

## Notes

- The script includes rate-limiting measures to avoid overloading the Wikisource server.
- If you encounter any issues with encoding, make sure your terminal and editor support UTF-8.

## Source

The content is scraped from [Wikisource](https://zh.wikisource.org/wiki/%E6%9D%B1%E5%9D%A1%E5%BF%97%E6%9E%97), which hosts the text in the public domain. 
