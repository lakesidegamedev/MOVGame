import { useState } from "react";
import { useAuthStore } from "@store/authStore";
import { useStoreNav } from "@store/storeNav";
import { isValidActivationCode, normalizeActivationCode } from "@lib/activationCode";
import { X, KeyRound, ShoppingBag } from "lucide-react";
import { Spinner } from "@ui/Skeleton";
import { useRequiredModalFocus } from "@ui/useRequiredModalFocus";

/** Redeem an activation code. Buying lives in the Store; this is only the code door. */
export function ActivationModal() {
  const activate = useAuthStore((s) => s.activate);
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthStore((s) => s.openModal);
  const closeModal = useAuthStore((s) => s.closeModal);
  const storeOpen = useStoreNav((s) => s.open);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const modalRef = useRequiredModalFocus<HTMLDivElement>();

  const normalized = normalizeActivationCode(code);
  const formatOk = normalized.length === 0 || isValidActivationCode(normalized);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isValidActivationCode(normalized)) {
      setError("Invalid format: expected CAMP-XXXX-XXXX-XXXX");
      return;
    }
    setBusy(true);
    const out = await activate(normalized);
    setBusy(false);
    if (out.error) { setError(out.error); return; }
    setCode("");
    setSuccess(out.packName ? `${out.packName} unlocked. Every scenario in the pack is now yours.` : "Scenario unlocked.");
  };

  return (
    <div className="overlay" onClick={closeModal}>
      <div
        className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="redeem-title" ref={modalRef}
        onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
      >
        <div className="head">
          <div className="tag">Unlock</div>
          <h2 id="redeem-title"><KeyRound size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />Redeem a code</h2>
          <button className="sheet-close" onClick={closeModal} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="body">
          {!user ? (
            <p className="muted">
              Log in to redeem a code:{" "}
              <button className="su-link" onClick={() => openModal("login")}>log in</button> or{" "}
              <button className="su-link" onClick={() => openModal("register")}>register</button> first.
            </p>
          ) : (
            <form onSubmit={submit}>
              <div className="field" style={{ textAlign: "left" }}>
                <label htmlFor="redeem-code">Code: CAMP-XXXX-XXXX-XXXX</label>
                <input
                  id="redeem-code" type="text" value={code} required placeholder="CAMP-…" autoComplete="off"
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  aria-invalid={!formatOk}
                  style={{ width: "100%", fontFamily: "monospace", letterSpacing: 1 }}
                />
              </div>
              {!formatOk && (
                <p className="muted small" style={{ color: "var(--rose)" }}>
                  Use the form CAMP-XXXX-XXXX-XXXX (letters A-Z except O/I/L, digits 2-9).
                </p>
              )}
              {error && <p className="muted small" role="alert" style={{ color: "var(--rose)" }}>{error}</p>}
              {success && <p className="muted small" role="status" style={{ color: "var(--green)" }}>{success}</p>}
              <button className="primary" type="submit" disabled={busy || !formatOk || !normalized} style={{ width: "100%", marginTop: 8 }}>
                {busy ? <Spinner label="Redeeming…" /> : "Redeem"}
              </button>
            </form>
          )}
          {!storeOpen && (
            <p className="muted small" style={{ marginTop: 14 }}>
              Don't have a code?{" "}
              <button className="su-link" onClick={() => { closeModal(); useStoreNav.getState().openStore(); }}>
                <ShoppingBag size={12} style={{ verticalAlign: "-1px", marginRight: 3 }} />Browse the store
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
