#!/bin/bash

# Test build script for Lu Xun's Diary
# This script helps verify that the build works before pushing to CI

set -e

echo "🔧 Installing dependencies..."
pnpm install

echo "📦 Building frontend..."
pnpm build

echo "🦀 Building Tauri app..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Building for Windows with NSIS..."
    pnpm tauri build --target x86_64-pc-windows-msvc
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    if [[ $(uname -m) == "arm64" ]]; then
        pnpm tauri build --target aarch64-apple-darwin
    else
        pnpm tauri build --target x86_64-apple-darwin
    fi
else
    echo "Building for Linux..."
    pnpm tauri build --target x86_64-unknown-linux-gnu
fi

echo "✅ Build completed successfully!"
echo "📁 Check the src-tauri/target/release/bundle/ directory for artifacts" 
