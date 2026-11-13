import { useEffect, useState } from "react";
import { useAuthStore } from "@store/authStore";
import { PACKS_BY_ID } from "@content/packs";
import { useStoreNav } from "@store/storeNav";
import { isValidActivationCode, normalizeActivationCode } from "@lib/activationCode";
import { describeReason, ownershipRows } from "@lib/storeModel";
import { X, KeyRound, CircleUser, Link2, ShoppingBag, LogOut, RefreshCw, Check, Receipt, Trash2 } from "lucide-react";
import { Spinner } from "@ui/Skeleton";
import { LakesideButton } from "./LakesideButton";

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtAmount(cents: number | null, currency: string | null, provider: string): string {
  if (provider === "apple") return "App Store";
  if (provider === "google") return "Google Play";
  if (provider === "supporter") return "Lakeside supporter tier";
  if (provider === "free-access") return "Free access";
  if (cents == null || currency == null) return provider === "code" ? "Code" : "Purchase";
  if (cents === 0) return "Code";
  return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

// Account deletion (App Store 5.1.1(v), Play account deletion, privacy policy).
// Two steps: open the panel, then type the username to arm the button.
function DeleteAccountCard({ username }: { username: string }) {
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = typed.trim().toLowerCase() === username.toLowerCase();

  const cancel = () => { setOpen(false); setTyped(""); setError(null); };
  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    const out = await deleteAccount();
    // On success the store signs out and closes this modal.
    if (out) { setBusy(false); setError(out); }
  };

  if (!open) {
    return (
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 4 }}>
        <button className="danger small" onClick={() => setOpen(true)}>
          <Trash2 size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Delete account
        </button>
      </div>
    );
  }
  return (
    <div className="account-card" style={{ marginTop: 12, borderColor: "var(--negative-edge)" }} role="group" aria-label="Delete account">
      <div className="account-title" style={{ color: "var(--negative)" }}>
        <Trash2 size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />Delete account
      </div>
      <p className="small" style={{ margin: "6px 0" }}>
        This permanently deletes your game account <strong>{username}</strong>: your cloud saves, leaderboard and
        daily scores, and achievements. It cannot be undone.
      </p>
      <p className="muted small" style={{ margin: "0 0 8px" }}>
        Packs you bought stay with your Lakeside Games account. Sign in with it again and they are still yours.
        Campaigns saved on this device stay on this device. You are signed out afterwards.
      </p>
      <form onSubmit={confirm}>
        <label className="muted small" htmlFor="delete-account-confirm">Type your username to confirm</label>
        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          <input
            id="delete-account-confirm" type="text" value={typed} placeholder={username}
            autoComplete="off" spellCheck={false}
            onChange={(e) => setTyped(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button className="danger small" type="submit" disabled={!matches || busy}>
            {busy ? <Spinner label="Deleting…" /> : "Delete permanently"}
          </button>
          <button className="ghost small" type="button" onClick={cancel} disabled={busy}>Cancel</button>
        </div>
      </form>
      {error && (
        <p className="small" role="alert" style={{ margin: "8px 0 0", color: "var(--rose)" }}>{error}</p>
      )}
    </div>
  );
}

export function AccountModal() {
  const user = useAuthStore((s) => s.user);
  const unlocked = useAuthStore((s) => s.unlocked);
  const purchases = useAuthStore((s) => s.purchases);
  const loadPurchases = useAuthStore((s) => s.loadPurchases);
  const refreshEntitlements = useAuthStore((s) => s.refreshEntitlements);
  const activate = useAuthStore((s) => s.activate);
  const closeModal = useAuthStore((s) => s.closeModal);
  const logout = useAuthStore((s) => s.logout);

  const [code, setCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { void loadPurchases(); }, [loadPurchases]);

  const refresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    const [ok] = await Promise.all([refreshEntitlements(), loadPurchases()]);
    setRefreshing(false);
    setRefreshMsg(ok
      ? { ok: true, text: "Up to date with your Lakeside Games account." }
      : { ok: false, text: "Couldn't reach the Lakeside store. What you own is unchanged." });
  };
  const storeOpen = useStoreNav((st) => st.open);
  const openStore = () => { closeModal(); useStoreNav.getState().openStore(); };

  if (!user) return null;

  const normalized = normalizeActivationCode(code);
  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemMsg(null);
    if (!isValidActivationCode(normalized)) {
      setRedeemMsg({ ok: false, text: "Use the form CAMP-XXXX-XXXX-XXXX" });
      return;
    }
    setBusy(true);
    const out = await activate(normalized);
    setBusy(false);
    if (out.error) { setRedeemMsg({ ok: false, text: out.error }); return; }
    setCode("");
    setRedeemMsg({ ok: true, text: out.packName ? `${out.packName} unlocked.` : "Scenario unlocked." });
    void loadPurchases();
  };

  return (
    <div className="overlay" onClick={closeModal}>
      <div
        className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Your account"
        onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
      >
        <div className="head">
          <div className="tag">Account</div>
          <h2><CircleUser size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />Your Account</h2>
          <button className="modal-close" onClick={closeModal} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="body">

          {/* Identity */}
          <div className="account-card">
            <div className="account-row">
              <span className="k">Username</span>
              <span>{user.username}</span>
            </div>
            {/* Accounts made by a launcher sign in have no email. */}
            {user.email && (
              <div className="account-row">
                <span className="k">Email</span>
                <span>{user.email}</span>
              </div>
            )}
            <div className="account-row">
              <span className="k"><Link2 size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Lakeside Games account</span>
              {user.ahdLinked ? (
                <span className="account-chip linked">Linked</span>
              ) : (
                <span className="account-chip">Not linked</span>
              )}
            </div>
            {!user.ahdLinked && (
              <div style={{ marginTop: 10 }}>
                <LakesideButton linkOnly />
              </div>
            )}
            <p className="muted small" style={{ margin: "10px 0 0" }}>
              Your saved games sync to this account while you are signed in, so you can pick up a campaign on any device.
            </p>
          </div>

          {/* What you own */}
          <div className="account-card">
            <div className="account-title row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span><ShoppingBag size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />What you own</span>
              <span className="row" style={{ gap: 6 }}>
                <button className="ghost small" onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh purchases">
                  <RefreshCw size={12} className={refreshing ? "store-spin" : undefined} style={{ verticalAlign: "-2px", marginRight: 4 }} />Refresh
                </button>
                {!storeOpen && <button className="ghost small" onClick={openStore}>Store</button>}
              </span>
            </div>
            <div className="account-owned">
              {ownershipRows(unlocked, purchases).map((row) => (
                <div className="account-row" key={row.key}>
                  <span className="k">
                    <Check size={12} style={{ verticalAlign: "-2px", marginRight: 5, color: "var(--green)" }} aria-hidden="true" />
                    <strong>{row.name}</strong>
                    <span className="muted small" style={{ display: "block", marginLeft: 17 }}>{row.detail}</span>
                  </span>
                  <span className="muted small" style={{ textAlign: "right" }}>{describeReason(row.reason)}</span>
                </div>
              ))}
              {unlocked.scenarioIds
                .filter((sid) => !unlocked.packIds.some((p) => PACKS_BY_ID[p]?.scenarios.includes(sid)))
                .map((sid) => (
                  <div className="account-row" key={sid}>
                    <span className="k"><Check size={12} style={{ verticalAlign: "-2px", marginRight: 5, color: "var(--green)" }} aria-hidden="true" />{sid}</span>
                    <span className="muted small">Unlocked with a code</span>
                  </div>
                ))}
            </div>
            {refreshMsg && (
              <p className="muted small" role="status" style={{ margin: "8px 0 0", color: refreshMsg.ok ? "var(--green)" : "var(--rose)" }}>{refreshMsg.text}</p>
            )}
          </div>

          {/* Purchase history */}
          {purchases.length > 0 && (
            <div className="account-card">
              <div className="account-title">
                <Receipt size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />Purchase history
              </div>
              <div>
                {purchases.map((p, i) => (
                  <div className="account-row" key={i}>
                    <span className="k">
                      {p.packName ?? (p.packId ? PACKS_BY_ID[p.packId]?.name ?? p.packId : p.scenarioId ?? "Unlock")}
                      {p.status === "refunded" && <span className="account-chip" style={{ marginLeft: 6 }}>Refunded</span>}
                    </span>
                    <span className="muted small" style={{ whiteSpace: "nowrap" }}>
                      {fmtAmount(p.amountCents, p.currency, p.provider)} · {fmtDate(p.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code redemption */}
          <div className="account-card">
            <div className="account-title">
              <KeyRound size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />Redeem an activation code
            </div>
            <form onSubmit={submitCode} className="row" style={{ gap: 8, marginTop: 8 }}>
              <input
                type="text" value={code} placeholder="CAMP-XXXX-XXXX-XXXX"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ flex: 1, fontFamily: "monospace", letterSpacing: 1, minWidth: 0 }}
              />
              <button className="primary small" type="submit" disabled={busy || !normalized}>
                {busy ? <Spinner label="Redeeming…" /> : "Redeem"}
              </button>
            </form>
            {redeemMsg && (
              <p className="muted small" style={{ margin: "8px 0 0", color: redeemMsg.ok ? "var(--green)" : "var(--rose)" }}>
                {redeemMsg.text}
              </p>
            )}
          </div>

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 4 }}>
            <button className="ghost small" onClick={() => { closeModal(); logout(); }}>
              <LogOut size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Log out
            </button>
          </div>

          <DeleteAccountCard username={user.username} />
        </div>
      </div>
    </div>
  );
}
