use std::sync::Mutex;

use tauri::{Manager, WindowEvent};

/// The Lakeside launcher starts installed games with a single-use sign-in code
/// in this variable (only when the player is signed in to the launcher).
const LAUNCHER_CODE_VAR: &str = "LAKESIDE_HANDOFF_CODE";

/// Name of the DOM event the page receives whenever the game window gains
/// focus. WebView2 does not always pass window focus on to the page (a restore
/// from the taskbar fires no `focus` or `visibilitychange` there), so the shell
/// says it itself. Kept in step with SHELL_FOCUS_EVENT in src/lib/desktopShell.ts.
const SHELL_FOCUS_SCRIPT: &str = "window.dispatchEvent(new Event('mov-shell-focus'))";

/// The launcher code this process was started with, handed to the page once.
struct LauncherCode(Mutex<Option<String>>);

/// Read the launcher code and remove it from this process's environment at
/// once, so nothing the game starts later (the system browser for checkout)
/// inherits it. The page checks the code's shape and tells the player when the
/// launcher sent something unusable, so an unreadable or oversized value is
/// kept as an empty string, never dropped silently. The code is never logged.
fn take_launcher_code_from_env() -> Option<String> {
    let raw = std::env::var_os(LAUNCHER_CODE_VAR);
    std::env::remove_var(LAUNCHER_CODE_VAR);
    let raw = raw?;
    let code = raw.to_str().map(str::trim).unwrap_or("");
    if code.len() > 512 {
        return Some(String::new());
    }
    Some(code.to_string())
}

/// The page asks for the launcher code once at startup. The first call gets it,
/// every later call (a reload, a second page) gets nothing.
#[tauri::command]
fn take_launcher_code(state: tauri::State<'_, LauncherCode>) -> Option<String> {
    state.0.lock().ok().and_then(|mut slot| slot.take())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let launcher_code = take_launcher_code_from_env();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(LauncherCode(Mutex::new(launcher_code)))
        .invoke_handler(tauri::generate_handler![take_launcher_code])
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(true) = event {
                if let Some(webview) = window.get_webview_window(window.label()) {
                    let _ = webview.eval(SHELL_FOCUS_SCRIPT);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Margin of Victory");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn takes_the_code_and_clears_the_variable() {
        std::env::set_var(LAUNCHER_CODE_VAR, " Ab3_-xY7Ab3_-xY7Ab3 ");
        assert_eq!(take_launcher_code_from_env().as_deref(), Some("Ab3_-xY7Ab3_-xY7Ab3"));
        assert!(std::env::var_os(LAUNCHER_CODE_VAR).is_none());
        std::env::set_var(LAUNCHER_CODE_VAR, "x".repeat(600));
        assert_eq!(take_launcher_code_from_env().as_deref(), Some(""));
        assert!(std::env::var_os(LAUNCHER_CODE_VAR).is_none());
        assert_eq!(take_launcher_code_from_env(), None);
    }
}
