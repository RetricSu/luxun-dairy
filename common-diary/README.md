# Common Diary

本应用收录了以下文学作品的日记：

- 鲁迅日记
- 徐霞客游记
- 东坡志林

在记录用户自己的日记的同时，也会展示这些文学作品的日记，增加趣味性。

因为文学日记格式各不相同，因此需要对格式进行统一。我们把符合这个统一格式的日记数据叫做 `Common Diary`。

## Common Diary 格式

Common Diary 的格式如下(以 Typescript 为例)：

```ts
interface CommonDiaryItem {
  title?: string; // 日记标题, 可选
  content: string; // 日记正文内容
  iso_date?: string; // ISO 8601 格式日期，可选
  date_raw?: string; // 原始日期格式, 可选
  weather?: string; // 天气, 可选
  tags?: string[]; // 标签, 可选
}

interface CommonDiary {
  author: string; // 作者;
  title?: string; // 标题, 可选
  count: number; // 日记数量;
  items: CommonDiaryItem[];
}
```

Rust 的格式如下：

```rust
struct CommonDiary {
  author: String,
  title: Option<String>,
  count: u32,
  items: Vec<CommonDiaryItem>,
}

struct CommonDiaryItem {
  title: Option<String>,
  content: String,
  iso_date: Option<String>,
  date_raw: Option<String>,
  weather: Option<String>,
  tags: Vec<String>,
}
```

## 使用方法

本应用支持从外部 JSON 文件加载著名日记（如鲁迅日记）。这种方法允许您在不重新构建应用程序的情况下添加新的日记，使应用程序更加灵活，并保持应用程序体积较小。

## 如何添加 Common Diaries

1. 根据 Common Diary 格式（见上文）格式化您的日记数据
2. 将文件保存为 JSON 文件（例如 `luxun-diary.json`）
3. 将文件放置在 Common Diaries 目录中：
   - **Windows**: `%APPDATA%\com.luxun.diary\common_diaries\`
   - **macOS**: `~/Library/Application Support/com.luxun.diary/common_diaries/`
   - **Linux**: `~/.local/share/com.luxun.diary/common_diaries/`

本应用会自动检测并加载此目录中的所有 JSON 文件。
