// Session lifetime, shared by the server-side expiry (MongoDB TTL index on
// `expires`) and the auth cookies' `Max-Age`. Single source of truth so the
// cookie and the persisted session always agree on how long a login lasts.
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days
