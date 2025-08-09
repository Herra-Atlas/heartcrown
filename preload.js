const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('menuAPI', {
  getHeaderHTML: () => ipcRenderer.invoke('get-header-html')
});

contextBridge.exposeInMainWorld('electronAPI', {
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
  // UUSI PALJASTETTU FUNKTIO
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    // Uudet (kryptografia ja asetukset)
  encrypt: (data) => ipcRenderer.invoke('crypto-encrypt', data),
  decrypt: (data) => ipcRenderer.invoke('crypto-decrypt', data),
  loadSettings: () => ipcRenderer.invoke('settings-load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings-save', settings),

  clearAppCache: () => ipcRenderer.invoke('clear-app-cache'),
  resetAppSettings: () => ipcRenderer.invoke('reset-app-settings'),
})