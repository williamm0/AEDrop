const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ae', {
  platform: process.platform,
  getVersions: () => ipcRenderer.invoke('get-ae-versions'),
  detect: (filePath) => ipcRenderer.invoke('detect-file', filePath),
  install: (payload) => ipcRenderer.invoke('install-file', payload),
  onProgress: (cb) => ipcRenderer.on('progress', (_, data) => cb(data)),
  openUrl: (url) => ipcRenderer.send('open-url', url),
  minimize: () => ipcRenderer.send('win-minimize'),
  close: () => ipcRenderer.send('win-close'),
})
