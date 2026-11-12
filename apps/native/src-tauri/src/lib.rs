use std::sync::Mutex;

use tauri::{Manager, WindowEvent};

/// The Lakeside launcher starts installed games with a single-use sign-in code
/// in this variable (only when the player is signed in to the launcher).
const LAUNCHER_CODE_VAR: &str = "LAKESIDE_HANDOFF_CODE";

/// Script that tells the page the game window gained focus. WebView2 does not
/// pass window focus on to the page (a restore from the taskbar fires no
/// `focus` or `visibilitychange` there), so the shell says it itself. Kept in
/// step with SHELL_FOCUS_EVENT in src/lib/desktopShell.ts.
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

/// Turns a stream of "is the window focused" readings into "it just came back".
#[cfg_attr(not(windows), allow(dead_code))]
struct FocusEdge {
    was_focused: bool,
}

#[cfg_attr(not(windows), allow(dead_code))]
impl FocusEdge {
    /// Starts as focused, so the window opening is not reported as a return.
    fn new() -> Self {
        Self { was_focused: true }
    }

    fn came_back(&mut self, focused: bool) -> bool {
        let back = focused && !self.was_focused;
        self.was_focused = focused;
        back
    }
}

/// Windows: with a single webview, Tauri reports window focus only when the
/// WebView2 control itself takes focus, and a restore from the taskbar or
/// Alt+Tab back to the window does not give it focus, so `Focused(true)` never
/// arrives. The native window's own focus state is right, so read it four
/// times a second and tell the page when it flips back. Stops when the window
/// is gone.
#[cfg(windows)]
fn watch_focus(window: tauri::WebviewWindow) {
    std::thread::spawn(move || {
        let mut edge = FocusEdge::new();
        loop {
            std::thread::sleep(std::time::Duration::from_millis(250));
            let Ok(focused) = window.is_focused() else { break };
            if edge.came_back(focused) {
                let _ = window.eval(SHELL_FOCUS_SCRIPT);
            }
        }
    });
}

#[cfg(windows)]
fn start_focus_watch(app: &tauri::App) {
    if let Some(window) = app.get_webview_window("main") {
        watch_focus(window);
    }
}

#[cfg(not(windows))]
fn start_focus_watch(_app: &tauri::App) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let launcher_code = take_launcher_code_from_env();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(LauncherCode(Mutex::new(launcher_code)))
        .invoke_handler(tauri::generate_handler![take_launcher_code])
        .setup(|app| {
            start_focus_watch(app);
            Ok(())
        })
        // macOS and Linux report window focus here; so does Windows when the
        // WebView2 control itself takes focus.
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
    fn reports_only_the_return_to_the_window() {
        let mut edge = FocusEdge::new();
        assert!(!edge.came_back(true), "opening is not a return");
        assert!(!edge.came_back(false));
        assert!(!edge.came_back(false));
        assert!(edge.came_back(true));
        assert!(!edge.came_back(true), "reported once");
        assert!(!edge.came_back(false));
        assert!(edge.came_back(true));
    }

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
