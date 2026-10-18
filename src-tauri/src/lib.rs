mod files;
mod licensing;

use licensing::{ImportOutcomeDto, LicenseStatusDto, Licensing};
use tauri::{Manager, State};

#[tauri::command]
fn license_status(licensing: State<'_, Licensing>) -> LicenseStatusDto {
    licensing.status()
}

#[tauri::command]
fn import_license(licensing: State<'_, Licensing>, code: String) -> ImportOutcomeDto {
    licensing.import(&code)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().map_err(|e| e.to_string());
            let version = app.package_info().version.to_string();
            app.manage(Licensing::initialize(data_dir, version));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![license_status, import_license, files::save_text_file])
        .run(tauri::generate_context!())
        .expect("error while running the CNS Test desktop application");
}
