#!/bin/bash

# Generate app icons from SVG
# Requires: ImageMagick (brew install imagemagick) or Inkscape

ASSETS_DIR="$(dirname "$0")/../assets"
SVG_FILE="$ASSETS_DIR/icon.svg"

echo "🎨 Generating app icons..."

# Check if ImageMagick is installed
if command -v magick &> /dev/null; then
    echo "Using ImageMagick..."
    
    # Generate PNG for Linux (512x512)
    magick "$SVG_FILE" -resize 512x512 "$ASSETS_DIR/icon.png"
    echo "✅ Generated icon.png (Linux)"
    
    # Generate ICO for Windows (multiple sizes)
    magick "$SVG_FILE" -resize 256x256 -define icon:auto-resize=256,128,64,48,32,16 "$ASSETS_DIR/icon.ico"
    echo "✅ Generated icon.ico (Windows)"
    
    # Generate ICNS for macOS
    mkdir -p "$ASSETS_DIR/icon.iconset"
    for size in 16 32 64 128 256 512; do
        magick "$SVG_FILE" -resize ${size}x${size} "$ASSETS_DIR/icon.iconset/icon_${size}x${size}.png"
        if [ $size -le 256 ]; then
            magick "$SVG_FILE" -resize $((size*2))x$((size*2)) "$ASSETS_DIR/icon.iconset/icon_${size}x${size}@2x.png"
        fi
    done
    
    # Create ICNS (macOS only)
    if command -v iconutil &> /dev/null; then
        iconutil -c icns "$ASSETS_DIR/icon.iconset" -o "$ASSETS_DIR/icon.icns"
        echo "✅ Generated icon.icns (macOS)"
        rm -rf "$ASSETS_DIR/icon.iconset"
    else
        echo "⚠️  iconutil not available (not on macOS). icon.icns not generated."
        echo "   Run this script on macOS to generate icon.icns"
    fi
    
elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    
    # Generate PNG for Linux
    inkscape "$SVG_FILE" -w 512 -h 512 -o "$ASSETS_DIR/icon.png"
    echo "✅ Generated icon.png (Linux)"
    
    echo "⚠️  For ICO and ICNS, please install ImageMagick: brew install imagemagick"
    
else
    echo "❌ Error: Neither ImageMagick nor Inkscape found."
    echo "   Install one of them:"
    echo "   - macOS: brew install imagemagick"
    echo "   - Ubuntu: sudo apt install imagemagick"
    echo "   - Windows: choco install imagemagick"
    exit 1
fi

echo ""
echo "🎉 Icon generation complete!"
echo ""
echo "Generated files:"
ls -la "$ASSETS_DIR"/icon.* 2>/dev/null

