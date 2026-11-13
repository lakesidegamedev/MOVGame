// @vitest-environment jsdom
// Delete account on the web Account screen: two steps, the username typed to
// arm the button, the server call, and sign out afterwards.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useAuthStore } from "@store/authStore";
import { storeSession, getToken } from "@lib/api";
import { AccountModal } from "../AccountModal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const player = { id: "u1", username: "campaigner", email: "c@example.com", ahdLinked: true };

type Reply = { status: number; body: unknown };
let deleteReply: Reply;
let fetchMock: ReturnType<typeof vi.fn>;

let root: Root;
let container: HTMLElement;

const json = ({ status, body }: Reply) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(<AccountModal />); });
}
const text = () => container.textContent ?? "";
const button = (label: RegExp) =>
  [...container.querySelectorAll<HTMLButtonElement>("button")].find((b) => label.test(b.textContent ?? ""));
const click = async (el: Element | undefined) => {
  expect(el).toBeTruthy();
  await act(async () => { (el as HTMLElement).click(); });
};
const type = (value: string) => {
  const input = container.querySelector<HTMLInputElement>("#delete-account-confirm")!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const deleteCalls = () => fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "DELETE");

beforeEach(() => {
  localStorage.clear();
  storeSession("token-1", player);
  deleteReply = { status: 200, body: { deleted: true } };
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "DELETE" && url.endsWith("/api/auth/account")) return json(deleteReply);
    // Purchases and anything else the screen loads: an empty, verified answer.
    return json({ status: 200, body: { purchases: [], verified: true } });
  });
  vi.stubGlobal("fetch", fetchMock);
  useAuthStore.setState({
    user: player, unlocked: { scenarioIds: [], packIds: [] }, purchases: [],
    modal: "account", notice: null, serverDown: false,
  });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("Delete account on the web", () => {
  it("asks first and says what goes and what stays", async () => {
    mount();
    expect(container.querySelector("#delete-account-confirm")).toBeNull();
    await click(button(/^Delete account$/));
    expect(text()).toContain("cloud saves, leaderboard and daily scores, and achievements");
    expect(text()).toContain("cannot be undone");
    expect(text()).toContain("Packs you bought stay with your Lakeside Games account");
    expect(text()).toContain("You are signed out afterwards");
    expect(deleteCalls()).toHaveLength(0);
  });

  it("keeps the delete button off until the username is typed", async () => {
    mount();
    await click(button(/^Delete account$/));
    const go = () => button(/Delete permanently/)!;
    expect(go().disabled).toBe(true);
    type("campaign");
    expect(go().disabled).toBe(true);
    type("Campaigner ");
    expect(go().disabled).toBe(false);
  });

  it("Cancel closes the panel without calling the server", async () => {
    mount();
    await click(button(/^Delete account$/));
    type("campaigner");
    await click(button(/^Cancel$/));
    expect(container.querySelector("#delete-account-confirm")).toBeNull();
    expect(deleteCalls()).toHaveLength(0);
    expect(useAuthStore.getState().user).not.toBeNull();
  });

  it("deletes on the server, then signs out and closes the screen", async () => {
    mount();
    await click(button(/^Delete account$/));
    type("campaigner");
    await click(button(/Delete permanently/));

    expect(deleteCalls()).toHaveLength(1);
    const [url, init] = deleteCalls()[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/auth\/account$/);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-1");

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.modal).toBeNull();
    expect(state.notice).toEqual({ kind: "account-deleted" });
    expect(getToken()).toBeNull();
  });

  it("stays signed in and says why when the server refuses", async () => {
    deleteReply = { status: 500, body: { error: "Database is busy" } };
    mount();
    await click(button(/^Delete account$/));
    type("campaigner");
    await click(button(/Delete permanently/));

    expect(container.querySelector("[role=alert]")?.textContent).toBe("Database is busy");
    expect(useAuthStore.getState().user).not.toBeNull();
    expect(getToken()).toBe("token-1");
    expect(button(/Delete permanently/)!.disabled).toBe(false);
  });

  it("asks for a fresh sign in when the session has expired", async () => {
    deleteReply = { status: 401, body: { error: "Unauthorized" } };
    mount();
    await click(button(/^Delete account$/));
    type("campaigner");
    await click(button(/Delete permanently/));
    expect(container.querySelector("[role=alert]")?.textContent).toContain("Log in again");
    expect(useAuthStore.getState().user).not.toBeNull();
  });
});
