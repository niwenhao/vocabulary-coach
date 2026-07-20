#!/bin/bash
# Windows 向け配布 ZIP を作成するスクリプト
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$SCRIPT_DIR/vocabular-coach-windows"

echo "ビルド中..."
npm run build

echo "配布フォルダを準備中..."
rm -rf "$OUT"
mkdir -p "$OUT"

# dist の中身をコピー
cp -r "$SCRIPT_DIR/dist/"* "$OUT/"

# 起動スクリプトをコピー
cp "$SCRIPT_DIR/start.bat" "$OUT/"
cp "$SCRIPT_DIR/start-server.ps1" "$OUT/"

# ZIP 作成
ZIP_NAME="vocabular-coach-windows.zip"
cd "$SCRIPT_DIR"
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" "vocabular-coach-windows/"

echo ""
echo "完了: $SCRIPT_DIR/$ZIP_NAME"
echo "配布フォルダ: $OUT"
