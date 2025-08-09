const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('menuAPI', {
  getHeaderHTML: () => ipcRenderer.invoke('get-header-html')
});

contextBridge.exposeInMainWorld('electronAPI', {
  // Vanhat, toimivat kutsut
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  encrypt: (data) => ipcRenderer.invoke('crypto-encrypt', data),
  decrypt: (data) => ipcRenderer.invoke('crypto-decrypt', data),
  loadSettings: () => ipcRenderer.invoke('settings-load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings-save', settings),
  clearAppCache: () => ipcRenderer.invoke('clear-app-cache'),
  resetAppSettings: () => ipcRenderer.invoke('reset-app-settings'),

  // --- UUDET KUTSUT PÄIVITYKSILLE ---
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, ...args) => callback(...args)),
});