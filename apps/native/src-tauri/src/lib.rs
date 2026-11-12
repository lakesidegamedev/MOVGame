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

/// Sent before SHELL_FOCUS_SCRIPT when Windows activates the window, so the CI
/// smoke test can tell the activation hook's report from Tauri's own.
const ACTIVATION_COUNT_SCRIPT: &str = "window.__movActivations = (window.__movActivations || 0) + 1";

/// True when a WM_ACTIVATE wParam means the window became active (WA_ACTIVE or
/// WA_CLICKACTIVE in the low word), false for WA_INACTIVE.
#[cfg_attr(not(windows), allow(dead_code))]
fn activated(wparam: usize) -> bool {
    wparam & 0xFFFF != 0
}

/// Windows: Tauri reports focus only when the WebView2 control itself takes
/// focus, so a restore from the taskbar, Alt+Tab or a click on the title bar
/// tells the page nothing (CI runs 43313314086 and 43316276775). Windows sends
/// WM_ACTIVATE to the top-level window on every one of those, so the shell
/// listens for it on the game window and reports focus to the page.
#[cfg(windows)]
mod activation {
    use std::sync::OnceLock;
    use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
    use windows::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};

    const WM_ACTIVATE: u32 = 0x0006;
    const SUBCLASS_ID: usize = 0x4D4F_5641;
    static ON_ACTIVATE: OnceLock<Box<dyn Fn() + Send + Sync>> = OnceLock::new();

    unsafe extern "system" fn subclass(hwnd: HWND, msg: u32, wparam: WPARAM, lparam: LPARAM, _id: usize, _data: usize) -> LRESULT {
        if msg == WM_ACTIVATE && super::activated(wparam.0) {
            if let Some(notify) = ON_ACTIVATE.get() {
                notify();
            }
        }
        DefSubclassProc(hwnd, msg, wparam, lparam)
    }

    /// Call `notify` on every activation of `hwnd`. Must run on the thread that
    /// owns the window. Returns false if the hook could not be installed.
    pub fn watch(hwnd: HWND, notify: impl Fn() + Send + Sync + 'static) -> bool {
        if ON_ACTIVATE.set(Box::new(notify)).is_err() {
            return false;
        }
        unsafe { SetWindowSubclass(hwnd, Some(subclass), SUBCLASS_ID, 0).as_bool() }
    }
}

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
        .setup(|app| {
            #[cfg(windows)]
            if let Some(webview) = app.webview_windows().into_values().next() {
                if let Ok(hwnd) = webview.hwnd() {
                    activation::watch(hwnd, move || {
                        // Never evaluate inside the window procedure: Tauri would run
                        // the script inline on this thread. A short-lived thread
                        // queues it on the event loop instead.
                        let webview = webview.clone();
                        std::thread::spawn(move || {
                            let _ = webview.eval(&format!("{ACTIVATION_COUNT_SCRIPT}; {SHELL_FOCUS_SCRIPT}"));
                        });
                    });
                }
            }
            #[cfg(not(windows))]
            let _ = app;
            Ok(())
        })
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
    fn activation_reads_the_low_word() {
        assert!(activated(1)); // WA_ACTIVE
        assert!(activated(2)); // WA_CLICKACTIVE
        assert!(activated(0x0001_0001)); // active while still minimised
        assert!(!activated(0)); // WA_INACTIVE
        assert!(!activated(0x0001_0000)); // inactive and minimised
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
