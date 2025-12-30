const { ipcRenderer } = require('electron');

// DOM Elements
const cameraContainer = document.getElementById('camera-container');
const cameraFeed = document.getElementById('camera-feed');
const noCamera = document.getElementById('no-camera');
const retryCamera = document.getElementById('retry-camera');
const dragOverlay = document.getElementById('drag-overlay');

// State
let currentShape = 'circle';
let currentSize = 'medium';
let isMirrored = true;
let mediaStream = null;
let availableCameras = [];
let currentCameraIndex = 0;

// Size cycle
const sizes = ['small', 'medium', 'large'];

// Initialize camera
async function initCamera() {
  try {
    // First request permission to access camera
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    
    // Get list of video devices
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


// Select a specific camera
async function selectCamera(index) {
  if (index === currentCameraIndex) return;
  
  currentCameraIndex = index;
  await startCamera(availableCameras[index].deviceId);
}

async function startCamera(deviceId = null) {
  // Stop existing stream if any
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

// Shape switching
function setShape(shape) {
  // Remove all shape classes
  cameraContainer.classList.remove('shape-circle', 'shape-rounded', 'shape-rectangle');
  
  // Add animation class
  cameraContainer.classList.add('shape-changing');
  setTimeout(() => {
    cameraContainer.classList.remove('shape-changing');
  }, 300);
  
  // Add new shape class
  cameraContainer.classList.add(`shape-${shape}`);
  currentShape = shape;
}

// Size switching
function cycleSize() {
  const currentIndex = sizes.indexOf(currentSize);
  const nextIndex = (currentIndex + 1) % sizes.length;
  currentSize = sizes[nextIndex];
  
  // Update CSS class
  document.body.classList.remove('size-small', 'size-medium', 'size-large');
  document.body.classList.add(`size-${currentSize}`);
  
  // Tell main process to resize window
  ipcRenderer.send('set-size', currentSize);
}

// Toggle mirror mode
function toggleMirror() {
  isMirrored = !isMirrored;
  cameraFeed.classList.toggle('no-mirror', !isMirrored);
}

// Event Listeners
retryCamera.addEventListener('click', () => {
  initCamera();
});

// Listen for camera device changes (connect/disconnect)
navigator.mediaDevices.addEventListener('devicechange', async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  availableCameras = devices.filter(device => device.kind === 'videoinput');
});

// Listen for size changes from main process
ipcRenderer.on('size-changed', (_, size) => {
  currentSize = size;
  document.body.classList.remove('size-small', 'size-medium', 'size-large');
  document.body.classList.add(`size-${size}`);
});

// Manual drag handling (as backup if -webkit-app-region doesn't work perfectly)
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

dragOverlay.addEventListener('mousedown', (e) => {
  if (e.target === dragOverlay) {
    isDragging = true;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    cameraContainer.style.cursor = 'grabbing';
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.screenX - dragStartX;
    const deltaY = e.screenY - dragStartY;
    
    ipcRenderer.send('window-move', { x: deltaX, y: deltaY });
    
    dragStartX = e.screenX;
    dragStartY = e.screenY;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  cameraContainer.style.cursor = 'grab';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case '1':
      setShape('circle');
      break;
    case '2':
      setShape('rounded');
      break;
    case '3':
      setShape('rectangle');
      break;
    case 's':
      cycleSize();
      break;
    case 'm':
      toggleMirror();
      break;
  }
});

// Disable default context menu and show custom one
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  // Send request to main process to show context menu
  ipcRenderer.send('show-context-menu', {
    currentShape,
    currentSize,
    isMirrored,
    cameras: availableCameras.map((cam, i) => ({
      label: cam.label || `Camera ${i + 1}`,
      index: i,
      active: i === currentCameraIndex
    }))
  });
});

// Handle context menu actions from main process
ipcRenderer.on('menu-action', (_, action) => {
  switch (action.type) {
    case 'shape':
      setShape(action.value);
      break;
    case 'size':
      currentSize = action.value;
      document.body.classList.remove('size-small', 'size-medium', 'size-large');
      document.body.classList.add(`size-${action.value}`);
      ipcRenderer.send('set-size', action.value);
      break;
    case 'mirror':
      toggleMirror();
      break;
    case 'camera':
      selectCamera(action.value);
      break;
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initCamera();
  document.body.classList.add(`size-${currentSize}`);
});

// Handle visibility changes to re-init camera if needed
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !mediaStream) {
    initCamera();
  }
});

