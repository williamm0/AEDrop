# AEDrop

AEDrop is a small desktop installer for After Effects add-ons. Drop files or folders onto the window and it puts each one in the right Adobe folder for you.

It is built for the usual “where do I install this?” problem: plugins, scripts, presets, extension bundles, motion graphics templates, LUTs, and add-on folders all have different destinations. AEDrop detects what you dropped, finds installed After Effects versions when needed, and copies everything to the correct place.

## What it does

- Installs single files or multiple dropped items in one pass.
- Detects installed After Effects versions on macOS and Windows.
- Installs `.aex`, `.plugin`, `.bundle`, `.8bi`, and `.8bf` plugin files or bundles into `Plug-ins`.
- Installs `.jsx`, `.jsxbin`, `.js`, and `.jsxinc` scripts into `Scripts`.
- Sends ScriptUI panels to `Scripts/ScriptUI Panels`.
- Extracts `.zxp` CEP extensions into the Adobe CEP extensions folder.
- Copies CEP extension folders that include `CSXS/manifest.xml`.
- Installs `.ffx` animation presets into `Presets`.
- Installs `.mogrt` motion graphics templates into Adobe’s common Motion Graphics Templates folder.
- Installs `.cube`, `.look`, and `.3dl` LUT files into Adobe’s common Creative LUTs folder.
- Scans dropped folders so plugin bundles, preset packs, script packs, LUT packs, and template folders are recognised.
- Lets you choose the target version when more than one After Effects version is installed.
- Asks for admin permission only when the destination needs it.

## Why

After Effects add-ons are still distributed in a mix of formats, and the install instructions are often different for every download. AEDrop keeps that process simple: open it, drop the files, pick a version if needed, done.

## Supported files

| Type | Installed to |
| --- | --- |
| `.aex`, `.plugin`, `.bundle`, `.8bi`, `.8bf` | After Effects `Plug-ins` |
| Plugin folders and bundles | After Effects `Plug-ins` |
| `.jsx`, `.jsxbin`, `.js`, `.jsxinc` | After Effects `Scripts` |
| ScriptUI panels | `Scripts/ScriptUI Panels` |
| Script folders | After Effects `Scripts` |
| `.zxp` | Adobe CEP `extensions` |
| CEP extension folders | Adobe CEP `extensions` |
| `.ffx` | After Effects `Presets` |
| Preset folders | After Effects `Presets` |
| `.mogrt` | Adobe Common `Motion Graphics Templates` |
| `.cube`, `.look`, `.3dl` | Adobe Common `LUTs/Creative` |
| LUT folders | Adobe Common `LUTs/Creative` |

## Download

Installers are built for:

- macOS Apple Silicon: `AEDrop-1.0.0-arm64.dmg`
- macOS Intel: `AEDrop-1.0.0.dmg`
- Windows x64: `AEDrop Setup 1.0.0.exe`

The macOS builds are unsigned. On first launch, right-click the app and choose Open if Gatekeeper blocks it.

## Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm start
```

Build macOS installers:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

Build the Windows installer:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:win
```

## Notes

- Windows builds request administrator privileges through the installer.
- macOS only asks for elevation when copying into a protected After Effects folder.
- `.zxp` extraction uses the system `unzip` command on macOS and PowerShell `Expand-Archive` on Windows.
- Batch installs stop if an unsupported item is dropped, so nothing gets half-installed by mistake.

## Made by

Made by [JX](https://jxffx.com).
