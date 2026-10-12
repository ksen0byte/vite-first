@echo off
rem Vendor license tool. PowerShell/cmd pass arguments to .cmd files unchanged (unlike "npm run").
cargo run --quiet --manifest-path "%~dp0src-tauri\Cargo.toml" -p cns-license-tool -- %*
