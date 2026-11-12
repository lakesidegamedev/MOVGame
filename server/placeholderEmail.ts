// Accounts without an email.
//
// users.email is NOT NULL and UNIQUE, and every account used to arrive with
// one. A launcher sign in does not: the platform's redeem answer carries only
// the account id and display name. Such an account stores a placeholder under
// the reserved .invalid top-level domain (RFC 2606), which can never receive
// mail, derived from the platform account id so it is unique and stable.
//
// Rules that keep the placeholder inert:
// - never shown to the player (publicEmail returns ""),
// - never sent to the platform (identity reads treat it as no email),
// - never registrable (sign up refuses .invalid addresses),
// - replaced by the real address the first time a Lakeside sign in brings one.
// The password on such an account is unusable, so email and password login
// cannot open it either.

const DOMAIN = "launcher.invalid";

export function placeholderEmail(platformAccountId: string): string {
  return `${platformAccountId.toLowerCase().replace(/[^a-z0-9]/g, "-")}@${DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.toLowerCase().endsWith(`@${DOMAIN}`);
}

/** The email to show the player or send anywhere: "" for a placeholder. */
export function publicEmail(email: string | null | undefined): string {
  return !email || isPlaceholderEmail(email) ? "" : email;
}

/** True for addresses under a reserved .invalid domain, which sign up must refuse. */
export function isReservedEmail(email: string): boolean {
  return /\.invalid$/i.test(email.trim());
}
