import { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Default bubble size
let currentWidth = 220;
let currentHeight = 220;

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: currentWidth,
    height: currentHeight,
    x: screenWidth - currentWidth - 50,
    y: screenHeight - currentHeight - 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    vibrancy: undefined, // Disable vibrancy for true transparency
    visualEffectState: 'active',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setHasShadow(false);
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setBackgroundColor('#00000000');
  mainWindow.setMinimumSize(50, 50); // Allow very small windows

  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Camera',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Reset to Circle',
      click: () => {
        if (mainWindow) {
          resizeWindow(220, 220);
          mainWindow.webContents.send('sync-size', { width: 200, height: 200 });
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setToolTip('Camera Bubble');
  tray.setContextMenu(contextMenu);
}

function resizeWindow(width: number, height: number): void {
  if (mainWindow && width && height && !isNaN(width) && !isNaN(height)) {
    // Ensure integers and minimum size
    const w = Math.max(50, Math.round(width));
    const h = Math.max(50, Math.round(height));
    currentWidth = w;
    currentHeight = h;
    mainWindow.setSize(w, h);
    // Ensure transparency after resize
    mainWindow.setBackgroundColor('#00000000');
  }
}

// IPC: Move window by delta
ipcMain.on('window-move', (_, { x, y }: { x: number; y: number }) => {
  if (mainWindow && typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
    const [currentX, currentY] = mainWindow.getPosition();
    mainWindow.setPosition(currentX + Math.round(x), currentY + Math.round(y));
  }
});

// IPC: Resize window
ipcMain.on('resize-window', (_, { width, height }: { width: number; height: number }) => {
  resizeWindow(width, height);
});

// Context menu handler
interface ContextMenuData {
  bubbleWidth: number;
  bubbleHeight: number;
  isMirrored: boolean;
  isCustomMode: boolean;
  currentShape: string;
  cameras: Array<{ label: string; index: number; active: boolean }>;
}

ipcMain.on('show-context-menu', (_, data: ContextMenuData) => {
  if (!mainWindow) return;

  const cameraSubmenu = data.cameras.map((cam) => ({
    label: cam.label,
    type: 'radio' as const,
    checked: cam.active,
    click: () => {
      mainWindow?.webContents.send('menu-action', { type: 'camera', value: cam.index });
    }
  }));

  // Determine current shape mode for checkmarks
  const isCustomMode = data.isCustomMode;
  
  const template = [
    {
      label: 'Shape',
      submenu: [
        {
          label: 'Circle',
          type: 'radio' as const,
          checked: !isCustomMode && data.currentShape === 'circle',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'shape', value: 'circle' })
        },
        {
          label: 'Rounded',
          type: 'radio' as const,
          checked: !isCustomMode && data.currentShape === 'rounded',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'shape', value: 'rounded' })
        },
        {
          label: 'Rectangle',
          type: 'radio' as const,
          checked: !isCustomMode && data.currentShape === 'rectangle',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'shape', value: 'rectangle' })
        },
        { type: 'separator' as const },
        {
          label: 'Custom (drag edges to reshape)',
          type: 'radio' as const,
          checked: isCustomMode,
          click: () => mainWindow?.webContents.send('menu-action', { type: 'custom-mode' })
        }
      ]
    },
    {
      label: 'Size',
      submenu: [
        {
          label: 'Small',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'size', value: 'small' })
        },
        {
          label: 'Medium',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'size', value: 'medium' })
        },
        {
          label: 'Large',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'size', value: 'large' })
        }
      ]
    },
    { type: 'separator' as const },
    {
      label: 'Camera',
      submenu: cameraSubmenu.length > 0 ? cameraSubmenu : [{ label: 'No cameras found', enabled: false }]
    },
    {
      label: data.isMirrored ? '✓ Mirror' : 'Mirror',
      click: () => mainWindow?.webContents.send('menu-action', { type: 'mirror' })
    },
    { type: 'separator' as const },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: mainWindow });
});

// App ready
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
