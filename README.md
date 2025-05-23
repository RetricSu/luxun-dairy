# 鲁迅日记 (Lu Xun's Diary)

一个基于 Tauri、Preact 和 TypeScript 的桌面应用，用于记录每天的日记。

<img src="./docs/screenshot.png" alt="鲁迅日记" height="180"><img src="./docs/screenshot-2.png" alt="鲁迅日记" height="180" height="300"><img src="./docs/screenshot-3.jpg" alt="鲁迅日记" height="180">

## 应用构想

这是一个现代化的日记应用，灵感来自于中国文学巨匠鲁迅的日记风格。主要特点：

- **简约界面**：专注于记录和管理日记，没有干扰的元素
- **本地应用**：没有服务器，完全本地运行
- **Nostr集成**：支持 Nostr 协议将单条日志加密分享给其他用户
- **公共日记**：提供在应用内阅读鲁迅、苏轼、徐霞客等公共版权文学日记

## 记录原则

- **重视日常记录**：鼓励记载每天发生的大小事件，形成完整的生活记录
- **避免零散想法**：反对记载零碎的想法和观点，因为日记是记录个人真实的生活，而不是表达思想和观点
- **每日一记**：每天只能记录一次，培养规律的日记习惯
- **随机展示**：记录完日记后会随机展示一篇鲁迅先生的日记，增加趣味性

## TODO

- [x] 增加分享单条日记给某个 Nostr 用户功能
- [x] 增加更多文学日记：苏轼、徐霞客
- [ ] 更新数据库结构，年/月/日键值对
