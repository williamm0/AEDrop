const root = document.documentElement
const dzPrimary = document.getElementById('dzPrimary')
const dzSecondary = document.getElementById('dzSecondary')
const dzProgressBar = document.getElementById('dzProgressBar')
const dzProgressLabel = document.getElementById('dzProgressLabel')
const pickerList = document.getElementById('pickerList')
const rcType = document.getElementById('rcType')
const rcName = document.getElementById('rcName')
const rcDest = document.getElementById('rcDest')
const resetBtn = document.getElementById('resetBtn')
const btnClose = document.getElementById('btnClose')
const btnMin = document.getElementById('btnMin')
const madeBy = document.getElementById('madeBy')

let aeVersions = []
let pendingItems = []

const supportedText = '.aex · .plugin · .jsx · .zxp · .ffx · .mogrt · LUTs · folders'

const typeLabels = {
  plugin:                  'After Effects Plugin',
  'plugin-bundle':         'Plugin Bundle',
  script:                  'After Effects Script',
  scriptui:                'ScriptUI Panel',
  'script-folder':         'Script Collection',
  'scriptui-folder':       'ScriptUI Panel Folder',
  extension:               'CEP Extension',
  'extension-folder':      'CEP Extension',
  preset:                  'Animation Preset',
  'preset-folder':         'Preset Folder',
  'motion-template':       'Motion Graphics Template',
  'motion-template-folder':'Motion Graphics Template Folder',
  lut:                     'LUT',
  'lut-folder':            'LUT Folder',
}

const destLabels = {
  plugin:                  'Plug-ins/',
  'plugin-bundle':         'Plug-ins/',
  script:                  'Scripts/',
  scriptui:                'Scripts/ScriptUI Panels/',
  'script-folder':         'Scripts/',
  'scriptui-folder':       'Scripts/ScriptUI Panels/',
  extension:               'CEP/extensions/',
  'extension-folder':      'CEP/extensions/',
  preset:                  'Presets/',
  'preset-folder':         'Presets/',
  'motion-template':       'Motion Graphics Templates/',
  'motion-template-folder':'Motion Graphics Templates/',
  lut:                     'Common/LUTs/Creative/',
  'lut-folder':            'Common/LUTs/Creative/',
}

function setState(s) {
  root.dataset.state = s
}

function needsAEVersion(type) {
  return ![
    'extension',
    'extension-folder',
    'motion-template',
    'motion-template-folder',
    'lut',
    'lut-folder',
  ].includes(type)
}

function needsAESelection(items) {
  return items.some(item => needsAEVersion(item.detection.type))
}

function setCardForItems(items) {
  if (items.length === 1) {
    const detection = items[0].detection
    rcType.textContent = typeLabels[detection.type] || 'Unknown'
    rcName.textContent = detection.name
    rcDest.textContent = '→ ' + (destLabels[detection.type] || '?')
    return
  }

  const destinations = new Set(items.map(item => destLabels[item.detection.type] || '?'))
  rcType.textContent = 'Batch Install'
  rcName.textContent = `${items.length} items ready`
  rcDest.textContent = destinations.size === 1 ? `→ ${Array.from(destinations)[0]}` : '→ Multiple destinations'
}

function setProgress(pct, label) {
  dzProgressBar.style.width = pct + '%'
  dzProgressLabel.textContent = label
}

function buildPicker(versions, onPick) {
  pickerList.innerHTML = ''
  for (const v of versions) {
    const btn = document.createElement('button')
    btn.className = 'picker-btn'
    btn.textContent = v.name
    btn.addEventListener('click', () => onPick(v))
    pickerList.appendChild(btn)
  }
}

async function runInstall(aePath) {
  setState('installing')
  setProgress(0, '')

  let installed = 0

  for (const item of pendingItems) {
    const label = pendingItems.length === 1 ? 'Installing...' : `Installing ${installed + 1} of ${pendingItems.length}`
    dzPrimary.textContent = label
    rcType.textContent = typeLabels[item.detection.type] || 'Installing'
    rcName.textContent = item.detection.name
    rcDest.textContent = '→ ' + (destLabels[item.detection.type] || '?')

    const result = await window.ae.install({
      filePath: item.filePath,
      detection: item.detection,
      aePath: needsAEVersion(item.detection.type) ? aePath : null,
    })

    if (!result.success) {
      dzPrimary.textContent = 'Installation failed'
      dzSecondary.textContent = result.error || 'Something went wrong'
      rcType.textContent = 'Error'
      rcName.textContent = item.detection.name
      rcDest.textContent = result.error || ''
      setState('error')
      return
    }

    installed += 1
  }

  setProgress(100, 'Installed')
  dzPrimary.textContent = installed === 1 ? 'Installed successfully' : `Installed ${installed} items`
  dzSecondary.textContent = ''
  rcType.textContent = installed === 1 ? (typeLabels[pendingItems[0].detection.type] || 'Installed') : 'Batch Complete'
  rcName.textContent = installed === 1 ? pendingItems[0].detection.name : `${installed} items installed`
  rcDest.textContent = ''
  setState('success')
}

async function handleDrop(filePaths) {
  setState('detecting')
  setProgress(0, 'Detecting...')
  dzPrimary.textContent = filePaths.length === 1 ? 'Detecting...' : `Detecting ${filePaths.length} items...`
  dzSecondary.textContent = ''

  const items = []
  const unsupported = []

  for (const filePath of filePaths) {
    const detection = await window.ae.detect(filePath)
    if (!detection || detection.type === 'unknown') {
      unsupported.push(detection ? detection.name : filePath.split('/').pop())
    } else {
      items.push({ filePath, detection })
    }
  }

  if (unsupported.length > 0) {
    dzPrimary.textContent = 'Not recognised'
    dzSecondary.textContent = `Unsupported: ${unsupported.slice(0, 3).join(', ')}${unsupported.length > 3 ? '…' : ''}`
    rcType.textContent = 'Unsupported'
    rcName.textContent = supportedText
    rcDest.textContent = ''
    setState('error')
    return
  }

  pendingItems = items
  setCardForItems(items)

  if (!needsAESelection(items)) {
    await runInstall(null)
    return
  }

  if (aeVersions.length === 0) {
    dzPrimary.textContent = 'After Effects not found'
    dzSecondary.textContent = 'Please install After Effects first'
    rcType.textContent = 'Error'
    rcName.textContent = 'No AE installation detected'
    rcDest.textContent = ''
    setState('error')
    return
  }

  if (aeVersions.length === 1) {
    await runInstall(aeVersions[0].path)
    return
  }

  dzPrimary.textContent = 'Choose a version'
  dzSecondary.textContent = items.length === 1 ? '' : `${items.length} items ready to install`
  buildPicker(aeVersions, async (v) => {
    await runInstall(v.path)
  })
  setState('version-select')
}

function reset() {
  pendingItems = []
  setProgress(0, '')
  dzPrimary.textContent = 'Drop files or folders'
  dzSecondary.textContent = supportedText
  pickerList.innerHTML = ''
  setState('idle')
}

document.addEventListener('dragenter', (e) => e.preventDefault())

document.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (root.dataset.state === 'idle') setState('dragover')
})

document.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
    if (root.dataset.state === 'dragover') setState('idle')
  }
})

document.addEventListener('drop', async (e) => {
  e.preventDefault()
  const s = root.dataset.state
  if (s !== 'idle' && s !== 'dragover') return
  const files = Array.from(e.dataTransfer.files)
  if (!files.length) return
  await handleDrop(files.map(file => file.path))
})

resetBtn.addEventListener('click', reset)
btnClose.addEventListener('click', () => window.ae.close())
btnMin.addEventListener('click', () => window.ae.minimize())
madeBy.addEventListener('click', () => window.ae.openUrl('https://jxffx.com'))

window.ae.onProgress(({ pct, msg }) => setProgress(pct, msg))

if (window.ae.platform === 'darwin') {
  document.body.classList.add('mac')
} else {
  document.body.classList.add('win')
}

;(async () => {
  reset()
  aeVersions = await window.ae.getVersions()
})()
