import { Spinner } from "@ui/Skeleton";

// Shown while a lazily loaded screen (and its content) downloads.
export const LazyFallback = () => (
  <div className="app screen center"><div className="setup"><p className="sub"><Spinner /></p></div></div>
);

// Lightweight fallback for the overlay modals (recap/event/debate/guide/
// candidates/stats/settings/timeline): matches their own overlay/modal
// shell so there's no full-screen flash while the chunk loads.
export const ModalFallback = () => (
  <div className="overlay"><div className="modal"><p className="sub"><Spinner /></p></div></div>
);

// A screen's code or content failed to download (offline, or a deploy
// replaced the files). Offers a retry and a way home.
export function LoadFailed({ onRetry, onExit }: { onRetry: () => void; onExit: () => void }) {
  return (
    <div className="app screen center">
      <div className="setup">
        <p className="sub">This campaign could not be loaded. Check your connection and try again.</p>
        <div className="row" style={{ gap: 8, justifyContent: "center" }}>
          <button className="primary" onClick={onRetry}>Try again</button>
          <button className="ghost" onClick={onExit}>Back to all scenarios</button>
        </div>
      </div>
    </div>
  );
}
