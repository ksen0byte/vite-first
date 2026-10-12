# Desktop edition and offline licensing

The desktop edition is the same Vite frontend packaged with [Tauri v2](https://tauri.app).
Data stays in IndexedDB (Dexie) inside the system webview (WebView2 on Windows), unchanged.
The desktop app is locked until a license signed by the vendor is imported. The web build (`npm run build`, GitHub Pages) is **not** licensed and runs exactly as before.

## Flow

```
install app → activation screen shows Installation ID + activation request (CNS-REQ1:…)
           → customer copies the request and sends it (e-mail, messenger) to the vendor
           → vendor runs `cns-license issue` → license code (CNS-LIC1:…)
           → vendor sends the code back; customer pastes it → app verifies it offline → unlocked
```

No network, server or account is involved at any step. Requests and licenses are exchanged as
copy-pasted text codes only; no request or license files exist.

## How it works

| Piece           | Where                                                      | Responsibility                                                                                                                                             |
|-----------------|------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `cns-licensing` | `src-tauri/crates/licensing`                               | Pure domain: installation identity, wire formats, Ed25519 sign/verify. No IO. Signing is behind the `issuer` feature and is **not** compiled into the app. |
| Host adapter    | `src-tauri/src/licensing.rs`                               | Reads the OS machine id, persists the installation seed and license in the app data dir, exposes `license_status` / `import_license` over IPC.             |
| Vendor CLI      | `src-tauri/crates/license-tool`, run via `cns-license.cmd` | `inspect`, `issue`, `verify`, `keygen`.                                                                                                                    |
| Frontend        | `src/licensing/`, `src/screens/activation-screen.ts`       | Decodes IPC responses, activation state machine, activation screen. `main.ts` registers no routes until access is granted.                                 |

**Installation ID** = `SHA-256("cns-test/installation/v1\n" ‖ machine-id ‖ "\n" ‖ seed)`, first
80 bits, shown as `XXXX-XXXX-XXXX-XXXX-XXXX`.

* `machine-id` is the OS machine identifier (Windows `MachineGuid`, Linux `/etc/machine-id`,
  macOS `IOPlatformUUID`). It is only hashed; the raw value never leaves the computer.
* `seed` is 16 random bytes created on first launch in
  `%APPDATA%\com.cnstest.desktop\installation.seed`. It gives every installation its own identity.

**License** = `CNS-LIC1:<base64url(json payload)>.<base64url(Ed25519 signature)>`. The signature
covers `"cns-test/license/v1\n" ‖ payload`. The payload holds product, license id, installation
id, licensee, issue time and an optional expiry. The app checks, in order: format → signature (embedded public key) → payload → installation id matches this installation → not
expired.
Whitespace and line breaks are ignored, so codes survive e-mail.

### What it protects against

* **Copying a license to another computer**: the installation id differs, so it is rejected with a clear message.
* **Copying the whole app data folder**: the machine id differs, so it is rejected.
* **Editing a license** (e.g. rebinding it or extending the expiry): the signature check fails.
* **Forging a license**: impossible without the private key.

### What it does not protect against (by design, no heavy DRM)

* Patching the app binary to skip the check.
* Cloned virtual machines / disk images (same machine id *and* seed).
* Turning the system clock back to extend a time-limited license.

### Things that require a new license

* Reinstalling Windows or anything else that changes `MachineGuid`.
* Deleting `%APPDATA%\com.cnstest.desktop\` (new seed, so a new installation id).
  Uninstalling the app normally keeps this folder.
* Changing the bundle `identifier` in `tauri.conf.json` (moves the app data dir). **Do not change it after release.**

### Where things are stored, and how to reset activation

The app uses **two** folders with the same name. Only the first one holds activation:

| Folder                                        | Contents                                                                           | Deleting it                                           |
|-----------------------------------------------|------------------------------------------------------------------------------------|-------------------------------------------------------|
| `%APPDATA%\com.cnstest.desktop\` (Roaming)    | `installation.seed`, `license.lic` (~1 KB)                                         | Resets activation **and** gives a new installation id |
| `%LOCALAPPDATA%\com.cnstest.desktop\` (Local) | WebView2 profile: **the users/tests database (IndexedDB)**, theme/language, caches | Deletes all test data; **does not** touch activation  |

Close the app first: it reads the license once at startup. Then, in PowerShell:

```powershell
# Remove the license only. Same installation id, so the same license code can be pasted again.
Remove-Item "$env:APPDATA\com.cnstest.desktop\license.lic"

# Simulate a fresh install: new installation id, so a new license is needed.
Remove-Item -Recurse "$env:APPDATA\com.cnstest.desktop"
```

## Vendor guide

Run the tool from the repository root with `.\cns-license` (PowerShell) or `cns-license` (cmd).
It needs the Rust toolchain; the first run compiles it. `.\cns-license --help` and
`.\cns-license issue --help` list every option.

> Don't use `npm run …` for this. PowerShell strips the `--` separator, so npm takes the tool's
> `--flags` as its own options.

The signing key is the only secret: anyone holding it can issue licenses. Keep it offline and
backed up (password manager, encrypted drive), never in the repository.

```powershell
# Once per PowerShell session: where your secret signing key is
$env:CNS_LICENSE_SIGNING_KEY = "D:\secure\vendor.signing.key"

# 1. See what the customer sent (paste their CNS-REQ1:… code)
.\cns-license inspect CNS-REQ1:eyJwcm9kdWN0Ijoi...

# 2. Issue the license. Pick exactly one of --perpetual / --valid-through (last valid day, UTC).
.\cns-license issue CNS-REQ1:eyJwcm9kdWN0Ijoi... --licensee "Clinic Name" --perpetual
.\cns-license issue CNS-REQ1:eyJwcm9kdWN0Ijoi... --licensee "Clinic Name" --valid-through 2027-12-31

# 3. Send the printed CNS-LIC1:… code to the customer. They paste it on the activation screen.

# Support: would this license unlock that installation?
.\cns-license verify CNS-LIC1:eyJwcm9kdWN0Ijoi... --installation-id 3919-85B7-234C-0AFC-07F9
```

Safety checks built into `issue`:

* It refuses a signing key that doesn't match the public key built into the app (`src-tauri/keys/license-public.key`), so you can't hand out licenses the app would reject.
* It verifies every license it produces before printing it.

Keep a record of which license id and installation id went to which customer. The tool does not keep a ledger.

### Replacing the key pair

```powershell
.\cns-license keygen --signing-key D:\secure\vendor.signing.key --public-key src-tauri\keys\license-public.key
```

Then rebuild and redistribute the app. Licenses issued with the old key stop working, so only do
this before the first release or if the signing key leaks.

## Desktop specifics

**Dialogs and exports.** In the Tauri webview, `alert()`/`confirm()` don't show and `<a download>`
saves silently to Downloads. `src/platform/dialogs.ts` therefore uses native dialogs on desktop (`tauri-plugin-dialog`) and a native "Save as" picker for exports. The chosen file
is written by the
`save_text_file` command (`src-tauri/src/files.rs`), so the frontend has no general file-write access.
The browser build keeps the native browser behaviour.

**Disk usage.** Our own data is tiny: `%APPDATA%\com.cnstest.desktop\` holds the installation seed
and license (~1 KB). `%LOCALAPPDATA%\com.cnstest.desktop\EBWebView\` is WebView2's Chromium profile (your IndexedDB data lives there too). A fresh profile is ~11 MB (mostly GPU
shader caches) and
can't be avoided. By default WebView2 also downloads Edge components in the background (ad-block
filter lists, speech recognition, DRM, hyphenation, …) and keeps an HTTP cache, which grew a
profile to ~50 MB. `additionalBrowserArgs` in `tauri.conf.json` turns that off (`--disable-component-update --disable-background-networking --disk-cache-size=1`), which also
keeps the app from making those background network requests. Keep Tauri's default
`--disable-features=…` in that string when editing it; setting the option replaces the defaults.

**Sizes (Windows x64).** `cns-test.exe` is ~9.3 MB (release build: LTO, stripped); the installers are ~3 MB (NSIS `-setup.exe`) and
~4 MB (MSI). The WebView2
runtime ships with Windows 10/11 and is not bundled.

## Developer guide

Prerequisites: Node, a Rust toolchain (MSVC on Windows), and WebView2 (preinstalled on Windows 10/11).

```bash
npm run desktop:dev      # Tauri window with hot reload (Vite on :1420, base "/")
npm run desktop:build    # installers in src-tauri/target/release/bundle/ (NSIS + MSI on Windows)
npm run test:rust        # licensing domain tests
cargo test --manifest-path src-tauri/Cargo.toml --workspace   # + host adapter flow tests
```

`npm run dev` / `npm test` / Playwright keep running the web edition, which bypasses licensing.
To reset activation locally, see [Where things are stored](#where-things-are-stored-and-how-to-reset-activation).
