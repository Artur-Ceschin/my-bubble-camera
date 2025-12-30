# My Bubble Camera 📷

A beautiful, open-source floating camera overlay for screen recording. Show your face in a stylish bubble while recording your screen with OBS, Loom, or any other screen recording software.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/github/actions/workflow/status/arturceschin/my-bubble-camera/ci.yml?branch=main)
![Release](https://img.shields.io/github/v/release/arturceschin/my-bubble-camera)

## ✨ Features

- **Floating Camera Window** - Always-on-top transparent window that stays visible while recording
- **Multiple Shapes** - Switch between circle, rounded rectangle, and rectangle shapes
- **Fluid Resizing** - Drag edges to reshape and resize freely
- **Draggable** - Move the camera bubble anywhere on your screen
- **Multiple Cameras** - Switch between FaceTime, iPhone Continuity Camera, and more
- **Border Themes** - Choose from Smoke, Ember, Pine, or Midnight border styles
- **Mirror/Flip** - Toggle camera mirroring
- **Keyboard Shortcuts** - Quick access to all features
- **Cross-Platform** - Works on macOS, Windows, and Linux

## 📦 Download & Install

### [⬇️ Download Latest Release](https://github.com/Artur-Ceschin/my-bubble-camera/releases/latest)

| Platform | File | Install Instructions |
|----------|------|---------------------|
| **macOS (Apple Silicon)** | `.dmg` | Open DMG → Drag to Applications |
| **macOS (Intel)** | `.dmg` | Open DMG → Drag to Applications |
| **Windows** | `.exe` | Run installer → Follow prompts |
| **Windows (Portable)** | `portable.exe` | Just run it, no install needed |
| **Linux (Universal)** | `.AppImage` | `chmod +x *.AppImage` → Run it |
| **Linux (Debian/Ubuntu)** | `.deb` | `sudo dpkg -i *.deb` |
| **Linux (Fedora/RHEL)** | `.rpm` | `sudo rpm -i *.rpm` |

### Quick Install Commands

**macOS** (after downloading .dmg):
```bash
# Open the DMG and drag to Applications, or:
open ~/Downloads/My-Bubble-Camera*.dmg
```

**Ubuntu/Debian**:
```bash
# Download and install
wget https://github.com/Artur-Ceschin/my-bubble-camera/releases/latest/download/my-bubble-camera_1.0.0_amd64.deb
sudo dpkg -i my-bubble-camera_1.0.0_amd64.deb
```

**Linux AppImage**:
```bash
# Download, make executable, and run
wget https://github.com/Artur-Ceschin/my-bubble-camera/releases/latest/download/My-Bubble-Camera-1.0.0-linux-x64.AppImage
chmod +x My-Bubble-Camera-1.0.0-linux-x64.AppImage
./My-Bubble-Camera-1.0.0-linux-x64.AppImage
```

### macOS Installation Note

Since this app isn't signed with an Apple Developer certificate, macOS may show **"App is damaged"** error. To fix this:

```bash
# Remove the quarantine attribute (run in Terminal)
xattr -cr /Applications/My\ Bubble\ Camera.app

# Or if still in Downloads folder:
xattr -cr ~/Downloads/My\ Bubble\ Camera.app
```

Then open the app normally. You only need to do this once.

## 🚀 Getting Started (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/arturceschin/my-bubble-camera.git
cd my-bubble-camera

# Install dependencies
npm install

# Start the app
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Circle shape |
| `2` | Rounded rectangle shape |
| `3` | Rectangle shape |
| `0` | Custom mode (free reshape) |
| `S` | Cycle through sizes |
| `B` | Cycle border themes |
| `M` | Toggle mirror mode |
| `+` / `=` | Grow (proportionally) |
| `-` | Shrink (proportionally) |
| `R` | Reset to default |

**Right-click** on the camera bubble to access all options.

## 🎨 Border Themes

- **Smoke** - Subtle dark gray with soft ambient glow
- **Ember** - Deep warm amber/rust tones  
- **Pine** - Muted forest green
- **Midnight** - Deep navy blue

## 🖥️ Usage with Screen Recording

1. Start Camera Bubble
2. Open your screen recording software (OBS, Loom, etc.)
3. Position the camera bubble where you want it on screen
4. Drag edges to resize/reshape as needed
5. Start recording - the bubble will be captured as part of your screen!

---

## 🔧 Building from Source

### Build for your platform

```bash
# Build for current platform
npm run package

# Build for specific platforms
npm run package:mac
npm run package:win  
npm run package:linux

# Build for all platforms (requires macOS for .dmg)
npm run package:all
```

### Generate App Icons

```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# sudo apt install imagemagick  # Ubuntu

# Generate icons
./scripts/generate-icons.sh
```

## 🚀 Creating a Release

### Automatic (Recommended)

Releases are automatically created when you push a version tag:

```bash
# Update version in package.json, then:
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

GitHub Actions will automatically:
1. Build for macOS, Windows, and Linux
2. Create a GitHub Release
3. Upload all installers

### Manual Release

```bash
# Build and publish (requires GH_TOKEN)
export GH_TOKEN=your_github_token
npm run release
```

## 📁 Project Structure

```
my-bubble-camera/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI on push/PR
│       └── release.yml     # Build & release on tags
├── assets/
│   ├── icon.svg            # Source icon
│   ├── icon.png            # Linux icon
│   ├── icon.ico            # Windows icon
│   ├── icon.icns           # macOS icon
│   └── entitlements.mac.plist
├── scripts/
│   └── generate-icons.sh   # Icon generation script
├── src/
│   ├── main/
│   │   └── main.ts         # Electron main process
│   └── renderer/
│       ├── index.html      # UI structure
│       ├── styles.css      # Styling
│       └── renderer.js     # UI logic & camera handling
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Quality

This project uses ESLint and Prettier. Pre-commit hooks automatically format your code:

```bash
# Manual formatting
npm run format

# Manual linting
npm run lint
npm run lint:fix
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Inspired by tools like Loom and mmhmm
