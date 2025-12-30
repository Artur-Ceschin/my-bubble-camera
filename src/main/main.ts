import { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Window size options (just slightly larger than bubble)
const SIZES = {
  small: { width: 160, height: 160 },
  medium: { width: 210, height: 210 },
  large: { width: 310, height: 310 }
};

let currentSize: keyof typeof SIZES = 'medium';

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const size = SIZES[currentSize];

  mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: screenWidth - size.width - 50,
    y: screenHeight - size.height - 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    roundedCorners: false,
    titleBarStyle: 'customButtonsOnHover',
    trafficLightPosition: { x: -100, y: -100 }, // Hide traffic lights
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Set the window to be visible on all workspaces/desktops
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  
  // Ensure no shadow on macOS
  mainWindow.setHasShadow(false);
  
  // Allow clicking through transparent areas (optional - can be toggled)
  mainWindow.setIgnoreMouseEvents(false);

  // Load the HTML file
  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  // Create a simple tray icon (you can replace with a proper icon)
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
      label: 'Size',
      submenu: [
        {
          label: 'Small',
          type: 'radio',
          checked: currentSize === 'small',
          click: () => resizeWindow('small')
        },
        {
          label: 'Medium',
          type: 'radio',
          checked: currentSize === 'medium',
          click: () => resizeWindow('medium')
        },
        {
          label: 'Large',
          type: 'radio',
          checked: currentSize === 'large',
          click: () => resizeWindow('large')
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Camera Bubble');
  tray.setContextMenu(contextMenu);
}

function resizeWindow(size: keyof typeof SIZES): void {
  if (mainWindow) {
    currentSize = size;
    const newSize = SIZES[size];
    mainWindow.setSize(newSize.width, newSize.height);
    mainWindow.webContents.send('size-changed', size);
  }
}

// IPC handlers for window dragging
ipcMain.on('window-move', (_, { x, y }: { x: number; y: number }) => {
  if (mainWindow) {
    const [currentX, currentY] = mainWindow.getPosition();
    mainWindow.setPosition(currentX + x, currentY + y);
  }
});

ipcMain.on('set-size', (_, size: keyof typeof SIZES) => {
  resizeWindow(size);
});

ipcMain.on('toggle-click-through', (_, enabled: boolean) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(enabled, { forward: true });
  }
});

// Context menu handler
interface ContextMenuData {
  currentShape: string;
  currentSize: string;
  isMirrored: boolean;
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

  const template = [
    {
      label: 'Shape',
      submenu: [
        {
          label: 'Circle',
          type: 'radio' as const,
          checked: data.currentShape === 'circle',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'shape', value: 'circle' })
        },
        {
          label: 'Rounded',
          type: 'radio' as const,
          checked: data.currentShape === 'rounded',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'shape', value: 'rounded' })
        },
        {
          label: 'Rectangle',
          type: 'radio' as const,
          checked: data.currentShape === 'rectangle',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'shape', value: 'rectangle' })
        }
      ]
    },
    {
      label: 'Size',
      submenu: [
        {
          label: 'Small',
          type: 'radio' as const,
          checked: data.currentSize === 'small',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'size', value: 'small' })
        },
        {
          label: 'Medium',
          type: 'radio' as const,
          checked: data.currentSize === 'medium',
          click: () => mainWindow?.webContents.send('menu-action', { type: 'size', value: 'medium' })
        },
        {
          label: 'Large',
          type: 'radio' as const,
          checked: data.currentSize === 'large',
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

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

