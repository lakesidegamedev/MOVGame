import { useEffect, useRef } from "react";

const FOCUSABLE = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Focus handling for a full-screen dialog that other dialogs (log in, account,
 * redeem) can open on top of: focus moves in on open, Tab wraps inside it,
 * Escape asks to close, and focus goes back to where it came from. While a
 * dialog above this one holds focus, the trap stands down so it never fights it.
 */
export function useDialogFocus<T extends HTMLElement>(onEscape: () => void) {
  const ref = useRef<T>(null);
  const escape = useRef(onEscape);
  escape.current = onEscape;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
    (root.querySelector<HTMLElement>("[data-autofocus]") ?? root).focus({ preventScroll: true });

    // Something above us (an .overlay dialog) owns focus: leave it alone.
    const covered = () => {
      const active = document.activeElement;
      return !!active && !root.contains(active) && !!active.closest("[role='dialog'], .overlay, .modal");
    };

    const onKey = (event: KeyboardEvent) => {
      if (covered()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        escape.current();
        return;
      }
      if (event.key !== "Tab") return;
      const list = items();
      if (!list.length) { event.preventDefault(); root.focus(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && (active === first || active === root)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);
  return ref;
}
