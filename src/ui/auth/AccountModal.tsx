import { useEffect, useState } from "react";
import { useAuthStore } from "@store/authStore";
import { PACKS_BY_ID } from "@content/packs";
import { useStoreNav } from "@store/storeNav";
import { isValidActivationCode, normalizeActivationCode } from "@lib/activationCode";
import { describeReason, ownershipRows } from "@lib/storeModel";
import { X, KeyRound, CircleUser, Link2, ShoppingBag, LogOut, RefreshCw, Check, Receipt } from "lucide-react";
import { Spinner } from "@ui/Skeleton";
import { LakesideButton } from "./LakesideButton";

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtAmount(cents: number | null, currency: string | null, provider: string): string {
  if (provider === "apple") return "App Store";
  if (provider === "google") return "Google Play";
  if (provider === "supporter") return "Supporter perk";
  if (cents == null || currency == null) return provider === "code" ? "Code" : "Purchase";
  if (cents === 0) return "Code";
  return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
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
          <button className="sheet-close" onClick={closeModal} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="body">

          {/* Identity */}
          <div className="account-card">
            <div className="account-row">
              <span className="k">Username</span>
              <span>{user.username}</span>
            </div>
            <div className="account-row">
              <span className="k">Email</span>
              <span>{user.email}</span>
            </div>
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
        </div>
      </div>
    </div>
  );
}
