# Test build script for Lu Xun's Diary on Windows
# This script helps verify that the build works before pushing to CI

$ErrorActionPreference = "Stop"

Write-Host "🔧 Installing dependencies..." -ForegroundColor Blue
pnpm install

Write-Host "📦 Building frontend..." -ForegroundColor Blue
pnpm build

Write-Host "🦀 Building Tauri app for Windows with NSIS..." -ForegroundColor Blue
pnpm tauri build --target x86_64-pc-windows-msvc

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "📁 Check the src-tauri/target/release/bundle/ directory for artifacts" -ForegroundColor Yellow 
