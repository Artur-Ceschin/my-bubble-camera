# Camera Bubble 📷

A beautiful, open-source floating camera overlay for screen recording. Show your face in a stylish bubble while recording your screen with OBS, Loom, or any other screen recording software.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **Floating Camera Window** - Always-on-top transparent window that stays visible while recording
- **Multiple Shapes** - Switch between circle, rounded rectangle, and rectangle shapes
- **Draggable** - Move the camera bubble anywhere on your screen
- **Resizable** - Choose from small, medium, or large sizes
- **Mirror/Flip** - Toggle camera mirroring or switch between multiple cameras
- **Keyboard Shortcuts** - Quick access to all features
- **Cross-Platform** - Works on macOS, Windows, and Linux

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/camera-bubble.git
cd camera-bubble

# Install dependencies
npm install

# Start the app in development mode
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev
```

### Building for Production

```bash
# Build for your current platform
npm run package

# Build for specific platforms
npm run package:mac
npm run package:win
npm run package:linux
```

## ⌨️ Keyboard Shortcuts

| Key   | Action                  |
| ----- | ----------------------- |
| `1`   | Circle shape            |
| `2`   | Rounded rectangle shape |
| `3`   | Rectangle shape         |
| `S`   | Cycle through sizes     |
| `C`   | Open camera selector    |
| `M`   | Toggle mirror mode      |
| `Esc` | Close camera selector   |

## 🎨 Customization

The app uses CSS variables for easy customization. Edit `src/renderer/styles.css` to change:

```css
:root {
  --bubble-size: 200px; /* Default size */
  --border-color: rgba(255, 255, 255, 0.3);
  --border-glow: rgba(120, 200, 255, 0.5);
  --control-bg: rgba(20, 20, 30, 0.85);
  --accent-color: #4fc3f7; /* Button highlight color */
}
```

## 🖥️ Usage with Screen Recording

1. Start Camera Bubble
2. Open your screen recording software (OBS, Loom, etc.)
3. Position the camera bubble where you want it on screen
4. Start recording - the bubble will be captured as part of your screen!

### OBS Tips

- The Camera Bubble window will be captured in your screen recording
- Position it in a corner that doesn't obstruct important content
- Use the size controls to adjust based on your recording resolution

## 📁 Project Structure

```
camera-bubble/
├── src/
│   ├── main/
│   │   └── main.ts          # Electron main process
│   └── renderer/
│       ├── index.html       # UI structure
│       ├── styles.css       # Styling
│       └── renderer.js      # UI logic & camera handling
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Inspired by tools like Loom and mmhmm
