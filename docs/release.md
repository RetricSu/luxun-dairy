# 鲁迅日记 GitHub CI/CD

本项目使用 GitHub Actions 进行持续集成和部署。以下是可用的工作流程：

## 持续集成 (CI)

当代码推送到 main/master 分支或对这些分支提交 Pull Request 时，CI 工作流将自动运行。它会：

- 安装依赖
- 运行类型检查
- 构建前端
- 构建 Tauri 应用

## 发布流程

当你推送一个新标签（以 'v' 开头，如 `v1.0.0`）时，发布工作流将：

1. 创建一个新的 GitHub Release (草稿模式)
2. 为三个主要平台构建应用：
   - Windows
   - macOS
   - Linux
3. 将构建好的安装包上传到 Release 资产
4. 发布 Release

### 权限设置

工作流采用 GitHub Actions 新的权限模型，无需手动配置 token：

- CI 工作流: 只有只读权限（`contents: read`, `pull-requests: read`）
- 发布工作流: 具有写入权限（`contents: write`, `packages: write` 等）

### 如何创建新版本

```bash
# 更新版本号 (在 package.json 和 src-tauri/tauri.conf.json 中)
# 提交更改
git commit -am "Bump version to X.Y.Z"

# 创建新标签
git tag vX.Y.Z

# 推送标签
git push origin vX.Y.Z
```

## 依赖更新

本项目使用 Dependabot 自动检查依赖更新：

- npm 包每周检查一次
- Rust crates 每周检查一次
- GitHub Actions 每月检查一次 
