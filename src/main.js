const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { execSync } = require('child_process')

let win

function createWindow() {
  const isDarwin = process.platform === 'darwin'

  const opts = {
    width: 560,
    height: 700,
    minWidth: 560,
    minHeight: 700,
    maxWidth: 560,
    maxHeight: 700,
    resizable: false,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  }

  if (isDarwin) {
    opts.transparent = true
    opts.vibrancy = 'under-window'
    opts.visualEffectState = 'active'
    opts.titleBarStyle = 'hidden'
    opts.trafficLightPosition = { x: 16, y: 18 }
  } else {
    opts.backgroundColor = '#07070f'
  }

  win = new BrowserWindow(opts)
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

function findAEInstallations() {
  const results = []

  if (process.platform === 'darwin') {
    try {
      const entries = fs.readdirSync('/Applications')
      for (const entry of entries) {
        if (/^Adobe After Effects/.test(entry)) {
          const full = path.join('/Applications', entry)
          try {
            if (fs.statSync(full).isDirectory()) {
              results.push({ name: entry, path: full })
            }
          } catch {}
        }
      }
    } catch {}
  } else if (process.platform === 'win32') {
    const bases = [
      path.join('C:\\', 'Program Files', 'Adobe'),
      path.join('C:\\', 'Program Files (x86)', 'Adobe'),
    ]
    for (const base of bases) {
      try {
        const entries = fs.readdirSync(base)
        for (const entry of entries) {
          if (/^Adobe After Effects/.test(entry)) {
            results.push({ name: entry, path: path.join(base, entry) })
          }
        }
      } catch {}
    }
  }

  return results.sort((a, b) => b.name.localeCompare(a.name))
}

function detectFileType(filePath) {
  let stat
  try {
    stat = fs.statSync(filePath)
  } catch {
    return null
  }

  const isDir = stat.isDirectory()
  const ext = path.extname(filePath).toLowerCase()
  const base = path.basename(filePath, ext).toLowerCase()

  if (!isDir) {
    if (ext === '.aex') return { type: 'plugin', name: path.basename(filePath) }

    if (ext === '.jsx' || ext === '.jsxbin') {
      const isPanel = /panel|ui\b/.test(base)
      return { type: isPanel ? 'scriptui' : 'script', name: path.basename(filePath) }
    }

    if (ext === '.zxp') return { type: 'extension', name: path.basename(filePath) }
    if (ext === '.ffx') return { type: 'preset', name: path.basename(filePath) }

    return { type: 'unknown', name: path.basename(filePath) }
  }

  try {
    if (fs.existsSync(path.join(filePath, 'CSXS', 'manifest.xml'))) {
      return { type: 'extension-folder', name: path.basename(filePath) }
    }

    const entries = fs.readdirSync(filePath)

    if (entries.some(e => /\.aex$/i.test(e))) {
      return { type: 'plugin-bundle', name: path.basename(filePath) }
    }

    if (entries.some(e => /\.(jsx|jsxbin)$/i.test(e))) {
      const hasPanel = entries.some(e => /panel/i.test(e))
      return {
        type: hasPanel ? 'scriptui-folder' : 'script-folder',
        name: path.basename(filePath),
      }
    }
  } catch {}

  return { type: 'unknown', name: path.basename(filePath) }
}

function pluginsDir(aePath) {
  if (process.platform === 'darwin') return path.join(aePath, 'Plug-ins')
  return path.join(aePath, 'Support Files', 'Plug-ins')
}

function scriptsDir(aePath) {
  if (process.platform === 'darwin') return path.join(aePath, 'Scripts')
  return path.join(aePath, 'Support Files', 'Scripts')
}

function scriptUIPanelsDir(aePath) {
  return path.join(scriptsDir(aePath), 'ScriptUI Panels')
}

function presetsDir(aePath) {
  if (process.platform === 'darwin') return path.join(aePath, 'Presets')
  return path.join(aePath, 'Support Files', 'Presets')
}

function cepExtensionsDir() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Adobe', 'CEP', 'extensions')
  }
  return path.join(process.env.APPDATA || '', 'Adobe', 'CEP', 'extensions')
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item)
    const d = path.join(dest, item)
    if (fs.statSync(s).isDirectory()) {
      copyRecursive(s, d)
    } else {
      fs.copyFileSync(s, d)
    }
  }
}

function esc(s) {
  return s.replace(/'/g, "'\\''")
}

function elevatedCopy(src, dest) {
  const isDir = fs.statSync(src).isDirectory()

  if (process.platform === 'darwin') {
    const cmd = isDir
      ? `mkdir -p '${esc(dest)}' && cp -r '${esc(src)}' '${esc(path.dirname(dest))}'`
      : `mkdir -p '${esc(path.dirname(dest))}' && cp '${esc(src)}' '${esc(dest)}'`
    execSync(`osascript -e 'do shell script "${cmd.replace(/"/g, '\\"')}" with administrator privileges'`)
  } else {
    const cmd = isDir
      ? `Copy-Item -Path '${src}' -Destination '${dest}' -Recurse -Force`
      : `New-Item -ItemType Directory -Path '${path.dirname(dest)}' -Force; Copy-Item -Path '${src}' -Destination '${dest}' -Force`
    execSync(`powershell -Command "${cmd}"`)
  }
}

function safeCopy(src, dest) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    if (fs.statSync(src).isDirectory()) {
      copyRecursive(src, dest)
    } else {
      fs.copyFileSync(src, dest)
    }
  } catch (e) {
    if (e.code === 'EACCES' || e.code === 'EPERM') {
      elevatedCopy(src, dest)
    } else {
      throw e
    }
  }
}

function extractZXP(zxpPath, destDir) {
  let bundleId = path.basename(zxpPath, '.zxp')

  try {
    const raw = execSync(`unzip -p "${zxpPath}" CSXS/manifest.xml`).toString()
    const m = raw.match(/BundleId[=\s"']+([A-Za-z0-9._-]+)/)
    if (m) bundleId = m[1]
  } catch {}

  const out = path.join(destDir, bundleId)
  fs.mkdirSync(out, { recursive: true })

  if (process.platform === 'darwin') {
    execSync(`unzip -q -o "${zxpPath}" -d "${out}"`)
  } else {
    execSync(`powershell -Command "Expand-Archive -Path '${zxpPath}' -DestinationPath '${out}' -Force"`)
  }

  return out
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function progress(pct, msg) {
  if (!win || win.isDestroyed()) return
  win.webContents.send('progress', { pct, msg })
}

async function runInstall(filePath, detection, aePath) {
  const { type } = detection

  progress(10, 'Scanning...')
  await delay(250)

  progress(30, 'Preparing...')
  await delay(200)

  const name = path.basename(filePath)

  if (type === 'plugin') {
    safeCopy(filePath, path.join(pluginsDir(aePath), name))
  } else if (type === 'plugin-bundle') {
    safeCopy(filePath, path.join(pluginsDir(aePath), name))
  } else if (type === 'script') {
    safeCopy(filePath, path.join(scriptsDir(aePath), name))
  } else if (type === 'scriptui') {
    fs.mkdirSync(scriptUIPanelsDir(aePath), { recursive: true })
    progress(60, 'Installing ScriptUI panel...')
    safeCopy(filePath, path.join(scriptUIPanelsDir(aePath), name))
  } else if (type === 'scriptui-folder') {
    fs.mkdirSync(scriptUIPanelsDir(aePath), { recursive: true })
    progress(60, 'Installing panel folder...')
    safeCopy(filePath, path.join(scriptUIPanelsDir(aePath), name))
  } else if (type === 'script-folder') {
    safeCopy(filePath, path.join(scriptsDir(aePath), name))
  } else if (type === 'extension') {
    const cep = cepExtensionsDir()
    fs.mkdirSync(cep, { recursive: true })
    progress(50, 'Extracting extension...')
    extractZXP(filePath, cep)
    progress(85, 'Finalizing...')
  } else if (type === 'extension-folder') {
    const cep = cepExtensionsDir()
    fs.mkdirSync(cep, { recursive: true })
    safeCopy(filePath, path.join(cep, name))
  } else if (type === 'preset') {
    safeCopy(filePath, path.join(presetsDir(aePath), name))
  } else {
    throw new Error('Unsupported file type')
  }

  progress(100, 'Done')
  await delay(150)
}

ipcMain.handle('get-ae-versions', () => findAEInstallations())

ipcMain.handle('detect-file', (_, filePath) => detectFileType(filePath))

ipcMain.handle('install-file', async (_, payload) => {
  try {
    await runInstall(payload.filePath, payload.detection, payload.aePath)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.on('open-url', (_, url) => shell.openExternal(url))
ipcMain.on('win-minimize', () => win?.minimize())
ipcMain.on('win-close', () => win?.close())
