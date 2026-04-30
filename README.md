# AEDrop

AEDrop is a small desktop installer for After Effects add-ons. Drop a plugin, script, preset, extension, or supported folder onto the window and it puts it in the right After Effects folder for you.

It is built for the usual “where do I install this?” problem: `.aex`, `.jsx`, `.jsxbin`, `.zxp`, `.ffx`, CEP extension folders, script folders, and plugin bundles all have different destinations. AEDrop detects the file type, finds installed After Effects versions, and copies everything to the correct place.

## What it does

- Detects installed After Effects versions on macOS and Windows.
- Installs `.aex` plugins into `Plug-ins`.
- Installs `.jsx` and `.jsxbin` scripts into `Scripts`.
- Sends ScriptUI panels to `Scripts/ScriptUI Panels`.
- Extracts `.zxp` CEP extensions into the Adobe CEP extensions folder.
- Copies CEP extension folders that already include `CSXS/manifest.xml`.
- Installs `.ffx` animation presets into `Presets`.
- Lets you choose the target version when more than one After Effects version is installed.
- Asks for admin permission only when the destination needs it.

## Why

After Effects add-ons are still distributed in a mix of formats, and the install instructions are often different for every download. AEDrop keeps that process simple: open it, drop the file, pick a version if needed, done.

## Supported files

| Type | Installed to |
| --- | --- |
| `.aex` | After Effects `Plug-ins` |
| Plugin folders | After Effects `Plug-ins` |
| `.jsx`, `.jsxbin` | After Effects `Scripts` |
| ScriptUI panels | `Scripts/ScriptUI Panels` |
| Script folders | After Effects `Scripts` |
| `.zxp` | Adobe CEP `extensions` |
| CEP extension folders | Adobe CEP `extensions` |
| `.ffx` | After Effects `Presets` |

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

## Made by

Made by [JX](https://jxffx.com).
