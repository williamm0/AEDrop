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
let pendingDetection = null
let pendingPath = null

const typeLabels = {
  plugin:            'After Effects Plugin',
  'plugin-bundle':   'Plugin Bundle',
  script:            'After Effects Script',
  scriptui:          'ScriptUI Panel',
  'script-folder':   'Script Collection',
  'scriptui-folder': 'ScriptUI Panel Folder',
  extension:         'CEP Extension',
  'extension-folder':'CEP Extension',
  preset:            'Animation Preset',
}

const destLabels = {
  plugin:            'Plug-ins/',
  'plugin-bundle':   'Plug-ins/',
  script:            'Scripts/',
  scriptui:          'Scripts/ScriptUI Panels/',
  'script-folder':   'Scripts/',
  'scriptui-folder': 'Scripts/ScriptUI Panels/',
  extension:         'CEP/extensions/',
  'extension-folder':'CEP/extensions/',
  preset:            'Presets/',
}

function setState(s) {
  root.dataset.state = s
}

function isCEPType(type) {
  return type === 'extension' || type === 'extension-folder'
}

function setCard(detection) {
  rcType.textContent = typeLabels[detection.type] || 'Unknown'
  rcName.textContent = detection.name
  rcDest.textContent = '→ ' + (destLabels[detection.type] || '?')
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

  const result = await window.ae.install({
    filePath: pendingPath,
    detection: pendingDetection,
    aePath: aePath || null,
  })

  if (result.success) {
    setProgress(100, 'Installed')
    dzPrimary.textContent = 'Installed successfully'
    rcType.textContent = typeLabels[pendingDetection.type] || 'Installed'
    setState('success')
  } else {
    dzPrimary.textContent = 'Installation failed'
    dzSecondary.textContent = result.error || 'Something went wrong'
    rcType.textContent = 'Error'
    rcName.textContent = result.error || 'Unknown error'
    rcDest.textContent = ''
    setState('error')
  }
}

async function handleDrop(filePath) {
  setState('detecting')
  setProgress(0, 'Detecting...')
  dzPrimary.textContent = 'Detecting...'
  dzSecondary.textContent = ''

  const detection = await window.ae.detect(filePath)

  if (!detection || detection.type === 'unknown') {
    dzPrimary.textContent = 'Not recognised'
    dzSecondary.textContent = 'Supports .aex · .jsx · .jsxbin · .zxp · .ffx · folders'
    rcType.textContent = 'Unsupported'
    rcName.textContent = detection ? detection.name : filePath.split('/').pop()
    rcDest.textContent = ''
    setState('error')
    return
  }

  pendingDetection = detection
  pendingPath = filePath
  setCard(detection)

  if (isCEPType(detection.type)) {
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
  dzSecondary.textContent = ''
  buildPicker(aeVersions, async (v) => {
    await runInstall(v.path)
  })
  setState('version-select')
}

function reset() {
  pendingDetection = null
  pendingPath = null
  setProgress(0, '')
  dzPrimary.textContent = 'Drop your file or folder'
  dzSecondary.textContent = '.aex · .jsx · .jsxbin · .zxp · .ffx · folders'
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
  await handleDrop(files[0].path)
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
  setState('idle')
  aeVersions = await window.ae.getVersions()
})()
