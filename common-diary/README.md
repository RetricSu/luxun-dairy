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

## Nostr 日记加密分享

本应用支持使用 Nostr 协议的 NIP-59（Gift Wrap）标准对您的日记条目进行加密分享。这使您可以安全地与朋友私密地分享特定的日记条目，同时确保只有指定的接收方可以阅读内容。

### 加密分享功能

加密分享功能使用了 Nostr 的以下标准：

- **NIP-59 Gift Wrap**: 将日记内容封装在一个加密的"礼品包装"中
- **NIP-44 加密**: 提供端到端的安全加密

### 如何使用加密分享

1. 在查看已完成的日记条目时，点击"加密分享日记"按钮
2. 输入接收方的 Nostr 公钥（十六进制格式）
3. 点击"创建 Gift Wrap"按钮
4. 选择一个 Nostr 中继服务器 URL（默认为 `wss://relay.damus.io/`）
5. 点击"分享到中继"按钮

### 技术说明

分享过程包含以下步骤：

1. 将您的日记条目转换为未签名的 Nostr 事件（称为"rumor"）
2. 使用您的私钥对其进行加密并签名（称为"seal"）
3. 将已加密和签名的内容包装在一个 gift wrap 事件中
4. 将 gift wrap 事件发送到指定的 Nostr 中继服务器

接收方可以使用兼容 NIP-59 的 Nostr 客户端打开您的加密日记。
