#!/usr/bin/env python3
"""
迁移脚本 - 从 jrnl 迁移数据到鲁迅日记

用法:
    python migrate-jrnl.py [jrnl_data_path]

默认 jrnl_data_path 为 ~/Desktop/brain
"""

import os
import sys
import re
import json
import sqlite3
import uuid
import datetime
from pathlib import Path
import time
import argparse  # 标准库，无需安装

# 获取命令行参数
parser = argparse.ArgumentParser(description='从 jrnl 迁移数据到鲁迅日记')
parser.add_argument('jrnl_path', nargs='?', default=os.path.expanduser('~/Desktop/brain'),
                    help='jrnl 数据路径 (默认: ~/Desktop/brain)')
args = parser.parse_args()

# 设置路径
JRNL_PATH = Path(args.jrnl_path)
if not JRNL_PATH.exists():
    print(f"错误: 路径 {JRNL_PATH} 不存在")
    sys.exit(1)

# 获取鲁迅日记数据库路径
def get_luxun_db_path():
    """获取鲁迅日记数据库路径"""
    # 根据平台判断数据目录
    home = Path.home()
    if sys.platform == 'darwin':  # macOS
        data_dir = home / "Library/Application Support/com.luxun.diary"
    elif sys.platform == 'win32':  # Windows
        data_dir = home / "AppData/Roaming/com.luxun.diary"
    else:  # Linux 和其他平台
        data_dir = home / ".local/share/com.luxun.diary"
    
    # 确保目录存在
    data_dir.mkdir(parents=True, exist_ok=True)
    
    return data_dir / "diary.db"

DB_PATH = get_luxun_db_path()
print(f"鲁迅日记数据库路径: {DB_PATH}")

# 创建或连接到数据库
def setup_db():
    """设置数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 创建表（如果不存在）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS diary_entries (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        weather TEXT NOT NULL,
        created_at TEXT NOT NULL,
        nostr_id TEXT UNIQUE,
        day TEXT UNIQUE,
        nostr_event TEXT
    )
    ''')
    
    conn.commit()
    return conn

# 解析 jrnl 条目文件
def parse_jrnl_entry(file_path):
    """解析单个 jrnl 条目文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    # 解析日期、天气和内容
    pattern = r'\[([\d-]+ [\d:]+)\] ?(.*?)\n(.*)'
    match = re.match(pattern, content, re.DOTALL)
    
    if match:
        timestamp_str = match.group(1)
        weather = match.group(2) or "未记录"
        entry_content = match.group(3).strip()
        
        # 转换时间戳格式
        timestamp = datetime.datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M')
        date_str = timestamp.strftime('%Y-%m-%d')
        
        return {
            'date': date_str,
            'timestamp': timestamp.isoformat(),
            'weather': weather,
            'content': entry_content
        }
    else:
        print(f"警告: 无法解析文件 {file_path}")
        return None

# 创建模拟的 Nostr 事件 JSON
def create_nostr_event_json(content, weather, day):
    """创建 Nostr 事件 JSON"""
    # 注意：这只是模拟的 Nostr 事件，不包含实际的签名
    # 实际应用中应该使用 nostr-sdk 生成
    event_id = uuid.uuid4().hex
    pubkey = "0000000000000000000000000000000000000000000000000000000000000000"
    created_at = int(time.time())
    
    event = {
        "id": event_id,
        "pubkey": pubkey,
        "created_at": created_at,
        "kind": 30027,
        "tags": [
            ["d", day],
            ["weather", weather]
        ],
        "content": content,
        "sig": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    }
    
    return json.dumps(event)

# 将条目保存到数据库
def save_entry_to_db(conn, entry_data, nostr_event_json):
    """将条目保存到数据库"""
    cursor = conn.cursor()
    
    # 检查是否已存在同一天的条目
    cursor.execute("SELECT id FROM diary_entries WHERE day = ?", (entry_data['date'],))
    existing = cursor.fetchone()
    
    if existing:
        print(f"跳过已存在的条目: {entry_data['date']}")
        return False
    
    # 创建新条目
    entry_id = str(uuid.uuid4())
    nostr_id = json.loads(nostr_event_json)['id']
    
    cursor.execute('''
    INSERT INTO diary_entries (id, content, weather, created_at, nostr_id, day, nostr_event)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        entry_id,
        entry_data['content'],
        entry_data['weather'],
        entry_data['timestamp'],
        nostr_id,
        entry_data['date'],
        nostr_event_json
    ))
    
    conn.commit()
    return True

# 扫描 jrnl 数据
def scan_jrnl_data(jrnl_path, conn):
    """扫描并迁移 jrnl 数据"""
    total_entries = 0
    migrated_entries = 0
    
    # 遍历年份文件夹
    for year_dir in jrnl_path.glob('20*'):
        if not year_dir.is_dir():
            continue
        
        print(f"处理年份: {year_dir.name}")
        
        # 遍历月份文件夹
        for month_dir in year_dir.glob('*'):
            if not month_dir.is_dir():
                continue
            
            print(f"  处理月份: {month_dir.name}")
            
            # 遍历日期文件
            for day_file in month_dir.glob('*.txt'):
                total_entries += 1
                
                print(f"    处理文件: {day_file.name}", end=' ')
                
                # 解析条目
                entry_data = parse_jrnl_entry(day_file)
                if not entry_data:
                    print("- 解析失败")
                    continue
                
                # 创建 Nostr 事件
                nostr_event_json = create_nostr_event_json(
                    entry_data['content'],
                    entry_data['weather'],
                    entry_data['date']
                )
                
                # 保存到数据库
                if save_entry_to_db(conn, entry_data, nostr_event_json):
                    migrated_entries += 1
                    print("- 已迁移")
                else:
                    print("- 已跳过")
    
    return total_entries, migrated_entries

# 主函数
def main():
    print(f"开始从 {JRNL_PATH} 迁移数据到鲁迅日记...")
    
    # 连接数据库
    conn = setup_db()
    
    try:
        # 扫描并迁移数据
        total, migrated = scan_jrnl_data(JRNL_PATH, conn)
        
        print("\n迁移完成!")
        print(f"总条目数: {total}")
        print(f"成功迁移: {migrated}")
        print(f"跳过条目: {total - migrated}")
        
    finally:
        # 关闭数据库连接
        conn.close()

if __name__ == "__main__":
    main() 
