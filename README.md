# 鲁迅日记 (Lu Xun's Diary)

一个基于 Tauri、Preact 和 TypeScript 的桌面应用，用于记录每天的日记。

![鲁迅日记](./docs/screenshot.png)

## 应用构想

这是一个现代化的日记应用，灵感来自于中国文学巨匠鲁迅的日记风格。主要特点：

- **简约界面**：专注于写作体验，没有干扰的元素
- **日期管理**：按日期整理和查看日记内容
- **Nostr集成**：支持使用 Nostr 协议进行加密和分享(todo)
- **多主题**：支持明亮和黑暗模式，适应不同环境
- **隐私保护**：使用 Nostr公钥加密确保日记内容的安全性

## 记录原则

- **重视日常记录**：鼓励记载每天发生的大小事件，形成完整的生活记录
- **避免零散想法**：反对记载零碎的想法和观点，因为日记是记录个人真实的生活，而不是表达思想和观点
- **每日一记**：每天只能记录一次，培养规律的日记习惯

## 技术栈

- **前端**：Preact + TypeScript + Vite
- **桌面支持**：Tauri (Rust)

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
