const { ipcRenderer } = require('electron');

// DOM Elements
const cameraContainer = document.getElementById('camera-container');
const cameraFeed = document.getElementById('camera-feed');
const noCamera = document.getElementById('no-camera');
const retryCamera = document.getElementById('retry-camera');
const dragOverlay = document.getElementById('drag-overlay');

// State
let isMirrored = true;
let mediaStream = null;
let availableCameras = [];
let currentCameraIndex = 0;
let currentBorderTheme = 'silver'; // silver, sunset, forest, ocean

// Bubble dimensions (fluid sizing)
let bubbleWidth = 200;
let bubbleHeight = 200;
const MIN_SIZE = 100; // Minimum size to avoid OS transparency issues
const MAX_SIZE = 500;
const EDGE_THRESHOLD = 15; // pixels from edge to trigger resize

// Resize state
let isResizing = false;
let resizeEdge = null; // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let lastMoveX = 0;
let lastMoveY = 0;

// Drag state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Shape preset (null = auto border-radius, or 'circle', 'rounded', 'rectangle')
let currentShapePreset = null;

// Initialize camera
async function initCamera() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras = devices.filter(device => device.kind === 'videoinput');
    
    if (availableCameras.length === 0) {
      showNoCamera();
      return;
    }

    await startCamera(availableCameras[currentCameraIndex].deviceId);
    hideNoCamera();
  } catch (error) {
    console.error('Error initializing camera:', error);
    showNoCamera();
  }
}

async function selectCamera(index) {
  if (index === currentCameraIndex) return;
  currentCameraIndex = index;
  await startCamera(availableCameras[index].deviceId);
}

async function startCamera(deviceId = null) {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 640 },
      facingMode: 'user'
    },
    audio: false
  };

  if (deviceId) {
    constraints.video.deviceId = { exact: deviceId };
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraFeed.srcObject = mediaStream;
    hideNoCamera();
  } catch (error) {
    console.error('Error starting camera:', error);
    showNoCamera();
  }
}

function showNoCamera() {
  cameraContainer.classList.add('hidden');
  noCamera.classList.remove('hidden');
}

function hideNoCamera() {
  cameraContainer.classList.remove('hidden');
  noCamera.classList.add('hidden');
}

// Toggle mirror mode
function toggleMirror() {
  isMirrored = !isMirrored;
  cameraFeed.classList.toggle('no-mirror', !isMirrored);
}

// Change border theme
function setBorderTheme(theme) {
  // Remove all theme classes
  document.body.classList.remove('border-silver', 'border-sunset', 'border-forest', 'border-ocean');
  // Add new theme class
  document.body.classList.add(`border-${theme}`);
  currentBorderTheme = theme;
}

// ============ FLUID RESIZE SYSTEM ============

// Calculate border-radius based on aspect ratio
function calculateBorderRadius(width, height) {
  const aspectRatio = width / height;
  
  const squareness = 1 - Math.abs(1 - aspectRatio) * 0.5;
  
  const maxRadiusPercent = 50;
  const minRadiusPercent = 5;
  
  const radiusPercent = minRadiusPercent + (maxRadiusPercent - minRadiusPercent) * squareness;
  
  return `${radiusPercent}%`;
}

// Update bubble size and shape
function updateBubbleSize(width, height, animate = false) {
  // Ensure valid integers
  bubbleWidth = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, width || MIN_SIZE)));
  bubbleHeight = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, height || MIN_SIZE)));
  
  // Clear shape preset when manually resizing (enables auto border-radius)
  currentShapePreset = null;
  
  applyBubbleStyles(animate);
}

// Update bubble size without clearing preset (used during resize drag)
function updateBubbleSizeNoPresetClear(width, height) {
  bubbleWidth = width;
  bubbleHeight = height;
  
  if (currentShapePreset === null) {
    const borderRadius = calculateBorderRadius(bubbleWidth, bubbleHeight);
    cameraContainer.style.borderRadius = borderRadius;
  }
  
  cameraContainer.style.transition = 'none';
  cameraContainer.style.width = `${bubbleWidth}px`;
  cameraContainer.style.height = `${bubbleHeight}px`;
  
  // Update window size to match
  ipcRenderer.send('resize-window', { 
    width: bubbleWidth + 20, 
    height: bubbleHeight + 20 
  });
}

// Apply bubble styles
function applyBubbleStyles(animate = false) {
  const borderRadius = currentShapePreset === null 
    ? calculateBorderRadius(bubbleWidth, bubbleHeight)
    : getBorderRadiusForPreset(currentShapePreset);
  
  if (animate) {
    cameraContainer.style.transition = 'width 0.2s ease, height 0.2s ease, border-radius 0.2s ease';
  } else {
    cameraContainer.style.transition = 'none';
  }
  
  cameraContainer.style.width = `${bubbleWidth}px`;
  cameraContainer.style.height = `${bubbleHeight}px`;
  cameraContainer.style.borderRadius = borderRadius;
  
  // Update window size to match
  ipcRenderer.send('resize-window', { 
    width: bubbleWidth + 20, 
    height: bubbleHeight + 20 
  });
}

// Get border radius for preset
function getBorderRadiusForPreset(preset) {
  switch (preset) {
    case 'circle': return '50%';
    case 'rounded': return '20px';
    case 'rectangle': return '8px';
    default: return calculateBorderRadius(bubbleWidth, bubbleHeight);
  }
}

function getResizeEdge(e) {
  const rect = cameraContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const width = rect.width;
  const height = rect.height;
  
  const nearLeft = x < EDGE_THRESHOLD;
  const nearRight = x > width - EDGE_THRESHOLD;
  const nearTop = y < EDGE_THRESHOLD;
  const nearBottom = y > height - EDGE_THRESHOLD;
  
  // Corners
  if (nearTop && nearLeft) return 'nw';
  if (nearTop && nearRight) return 'ne';
  if (nearBottom && nearLeft) return 'sw';
  if (nearBottom && nearRight) return 'se';
  
  // Edges
  if (nearTop) return 'n';
  if (nearBottom) return 's';
  if (nearLeft) return 'w';
  if (nearRight) return 'e';
  
  return null;
}

// Get cursor style for resize edge
function getResizeCursor(edge) {
  const cursors = {
    'n': 'ns-resize',
    's': 'ns-resize',
    'e': 'ew-resize',
    'w': 'ew-resize',
    'ne': 'nesw-resize',
    'sw': 'nesw-resize',
    'nw': 'nwse-resize',
    'se': 'nwse-resize'
  };
  return cursors[edge] || 'grab';
}

function handleMouseMove(e) {
  if (isResizing) {
    const deltaX = e.screenX - resizeStartX;
    const deltaY = e.screenY - resizeStartY;
    
    let newWidth = resizeStartWidth;
    let newHeight = resizeStartHeight;
    let totalMoveX = 0;
    let totalMoveY = 0;
    
    // Calculate new dimensions based on which edge is being dragged
    if (resizeEdge.includes('e')) {
      newWidth = resizeStartWidth + deltaX;
    }
    if (resizeEdge.includes('w')) {
      newWidth = resizeStartWidth - deltaX;
    }
    if (resizeEdge.includes('s')) {
      newHeight = resizeStartHeight + deltaY;
    }
    if (resizeEdge.includes('n')) {
      newHeight = resizeStartHeight - deltaY;
    }
    
    // Constrain dimensions
    const constrainedWidth = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, newWidth)));
    const constrainedHeight = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, newHeight)));
    
    // Calculate window movement needed (for resizing from top/left)
    if (resizeEdge.includes('w')) {
      totalMoveX = resizeStartWidth - constrainedWidth;
    }
    if (resizeEdge.includes('n')) {
      totalMoveY = resizeStartHeight - constrainedHeight;
    }
    
    // Only update if dimensions actually changed
    if (constrainedWidth !== bubbleWidth || constrainedHeight !== bubbleHeight) {
      // Calculate incremental move (difference from last move)
      const incrementalMoveX = totalMoveX - lastMoveX;
      const incrementalMoveY = totalMoveY - lastMoveY;
      
      updateBubbleSizeNoPresetClear(constrainedWidth, constrainedHeight);
      
      if (incrementalMoveX !== 0 || incrementalMoveY !== 0) {
        ipcRenderer.send('window-move', { x: incrementalMoveX, y: incrementalMoveY });
      }
      
      lastMoveX = totalMoveX;
      lastMoveY = totalMoveY;
    }
    
    return;
  }
  
  if (isDragging) {
    const deltaX = e.screenX - dragStartX;
    const deltaY = e.screenY - dragStartY;
    
    ipcRenderer.send('window-move', { x: deltaX, y: deltaY });
    
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    return;
  }
  
  // Detect edge hover
  const edge = getResizeEdge(e);
  if (edge) {
    cameraContainer.style.cursor = getResizeCursor(edge);
    dragOverlay.style.cursor = getResizeCursor(edge);
  } else {
    cameraContainer.style.cursor = 'grab';
    dragOverlay.style.cursor = 'grab';
  }
}

function handleMouseDown(e) {
  if (e.button !== 0) return; // Only left click
  
  const edge = getResizeEdge(e);
  
  if (edge) {
    isResizing = true;
    resizeEdge = edge;
    resizeStartX = e.screenX;
    resizeStartY = e.screenY;
    resizeStartWidth = bubbleWidth;
    resizeStartHeight = bubbleHeight;
    lastMoveX = 0;
    lastMoveY = 0;
    
    // Add visual feedback
    cameraContainer.classList.add('resizing');
    
    e.preventDefault();
    e.stopPropagation();
  } else {
    // Start dragging
    isDragging = true;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    cameraContainer.style.cursor = 'grabbing';
    dragOverlay.style.cursor = 'grabbing';
  }
}

// Handle mouse up
function handleMouseUp() {
  if (isResizing) {
    isResizing = false;
    resizeEdge = null;
    lastMoveX = 0;
    lastMoveY = 0;
    cameraContainer.classList.remove('resizing');
  }
  
  if (isDragging) {
    isDragging = false;
    cameraContainer.style.cursor = 'grab';
    dragOverlay.style.cursor = 'grab';
  }
}

// Event listeners for resize/drag
cameraContainer.addEventListener('mousedown', handleMouseDown);
dragOverlay.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);

// Prevent default drag behavior
dragOverlay.style.webkitAppRegion = 'no-drag';

// ============ OTHER EVENT LISTENERS ============

retryCamera.addEventListener('click', () => {
  initCamera();
});

navigator.mediaDevices.addEventListener('devicechange', async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  availableCameras = devices.filter(device => device.kind === 'videoinput');
});

const BORDER_THEMES = ['silver', 'sunset', 'forest', 'ocean'];

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case '1':
      applyShapePreset('circle');
      break;
    case '2':
      applyShapePreset('rounded');
      break;
    case '3':
      applyShapePreset('rectangle');
      break;
    case '0':
      // Enable custom/free mode
      enableCustomMode();
      break;
    case 's':
      // Cycle through sizes (proportionally)
      cycleSize();
      break;
    case 'b':
      // Cycle through border themes
      cycleBorderTheme();
      break;
    case 'm':
      toggleMirror();
      break;
    case 'r':
      // Reset to medium circle
      applyShapePreset('circle');
      applySizePreset('medium');
      break;
    case '=':
    case '+':
      // Grow (proportionally)
      scaleProportionally(1.15);
      break;
    case '-':
      // Shrink (proportionally)
      scaleProportionally(0.85);
      break;
  }
});

function cycleBorderTheme() {
  const currentIndex = BORDER_THEMES.indexOf(currentBorderTheme);
  const nextIndex = (currentIndex + 1) % BORDER_THEMES.length;
  setBorderTheme(BORDER_THEMES[nextIndex]);
}

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  ipcRenderer.send('show-context-menu', {
    bubbleWidth,
    bubbleHeight,
    isMirrored,
    isCustomMode: currentShapePreset === null,
    currentShape: currentShapePreset || 'custom',
    currentBorderTheme,
    cameras: availableCameras.map((cam, i) => ({
      label: cam.label || `Camera ${i + 1}`,
      index: i,
      active: i === currentCameraIndex
    }))
  });
});

// Handle context menu actions
ipcRenderer.on('menu-action', (_, action) => {
  switch (action.type) {
    case 'mirror':
      toggleMirror();
      break;
    case 'camera':
      selectCamera(action.value);
      break;
    case 'shape':
      applyShapePreset(action.value);
      break;
    case 'size':
      applySizePreset(action.value);
      break;
    case 'custom-mode':
      enableCustomMode();
      break;
    case 'border':
      setBorderTheme(action.value);
      break;
  }
});

function enableCustomMode() {
  currentShapePreset = null;
  const borderRadius = calculateBorderRadius(bubbleWidth, bubbleHeight);
  cameraContainer.style.transition = 'border-radius 0.2s ease';
  cameraContainer.style.borderRadius = borderRadius;
}

// Shape presets (override auto border-radius)
function applyShapePreset(shape) {
  currentShapePreset = shape;
  
  // Make it square for the shape to look right
  const size = Math.max(bubbleWidth, bubbleHeight);
  bubbleWidth = size;
  bubbleHeight = size;
  
  let borderRadius;
  switch (shape) {
    case 'circle':
      borderRadius = '50%';
      break;
    case 'rounded':
      borderRadius = '20px';
      break;
    case 'rectangle':
      borderRadius = '8px';
      break;
    default:
      borderRadius = calculateBorderRadius(bubbleWidth, bubbleHeight);
  }
  
  cameraContainer.style.transition = 'width 0.2s ease, height 0.2s ease, border-radius 0.2s ease';
  cameraContainer.style.width = `${bubbleWidth}px`;
  cameraContainer.style.height = `${bubbleHeight}px`;
  cameraContainer.style.borderRadius = borderRadius;
  
  ipcRenderer.send('resize-window', { 
    width: bubbleWidth + 20, 
    height: bubbleHeight + 20 
  });
}

// Size presets - maintains current proportions
const SIZE_PRESETS = {
  small: 150,  // Increased to avoid transparency issues
  medium: 200,
  large: 300
};
let currentSizePreset = 'medium';

function applySizePreset(size) {
  const targetSize = SIZE_PRESETS[size] || 200;
  currentSizePreset = size;
  
  // Scale proportionally based on the larger dimension
  const maxDimension = Math.max(bubbleWidth, bubbleHeight);
  const scale = targetSize / maxDimension;
  
  const newWidth = Math.round(bubbleWidth * scale);
  const newHeight = Math.round(bubbleHeight * scale);
  
  // Update size without clearing shape preset
  bubbleWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newWidth));
  bubbleHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newHeight));
  applyBubbleStyles(true);
}

// Cycle through size presets (S key)
function cycleSize() {
  const sizes = ['small', 'medium', 'large'];
  const currentIndex = sizes.indexOf(currentSizePreset);
  const nextIndex = (currentIndex + 1) % sizes.length;
  currentSizePreset = sizes[nextIndex];
  applySizePreset(currentSizePreset);
}

// Scale proportionally by a factor (for +/- keys)
function scaleProportionally(factor) {
  const newWidth = Math.round(bubbleWidth * factor);
  const newHeight = Math.round(bubbleHeight * factor);
  
  bubbleWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newWidth));
  bubbleHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newHeight));
  applyBubbleStyles(true);
}

ipcRenderer.on('sync-size', (_, { width, height }) => {
  bubbleWidth = width;
  bubbleHeight = height;
  updateBubbleSize(width, height, false);
});

document.addEventListener('DOMContentLoaded', () => {
  initCamera();
  updateBubbleSize(bubbleWidth, bubbleHeight, false);
  setBorderTheme(currentBorderTheme);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !mediaStream) {
    initCamera();
  }
});
