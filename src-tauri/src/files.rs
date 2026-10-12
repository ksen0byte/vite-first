//! Saving exports through the native "Save as" dialog.
//!
//! The destination is chosen by the user in the dialog and written here, so the frontend
//! never gets a general-purpose "write any path" capability.

use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
#[serde(tag = "_tag", rename_all_fields = "camelCase")]
pub enum SaveOutcomeDto {
    Saved { path: String },
    Cancelled,
    Failed { reason: String },
}

/// Async so the blocking dialog runs off the main thread (a sync command would deadlock it).
#[tauri::command]
pub async fn save_text_file(
    app: AppHandle,
    suggested_name: String,
    extension: String,
    contents: String,
) -> SaveOutcomeDto {
    let picked = app
        .dialog()
        .file()
        .set_file_name(&suggested_name)
        .add_filter(extension.to_uppercase(), &[extension.as_str()])
        .blocking_save_file();
    let Some(picked) = picked else {
        return SaveOutcomeDto::Cancelled;
    };
    match picked.into_path() {
        Err(e) => SaveOutcomeDto::Failed { reason: e.to_string() },
        Ok(path) => match std::fs::write(&path, contents) {
            Ok(()) => SaveOutcomeDto::Saved { path: path.display().to_string() },
            Err(e) => SaveOutcomeDto::Failed { reason: format!("cannot write {}: {e}", path.display()) },
        },
    }
}
