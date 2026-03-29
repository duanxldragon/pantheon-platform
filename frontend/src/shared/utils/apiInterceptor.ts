let warned = false;

/**
 * Legacy compatibility shim.
 *
 * Authentication refresh and retry are now handled centrally by `ApiClient`.
 * We intentionally avoid overriding `window.fetch` here because the old global
 * interception path duplicated auth logic and could interfere with normal API
 * requests.
 */
export function initializeApiInterceptor() {
  if (import.meta.env.DEV && !warned) {
    warned = true;
    console.info('[apiInterceptor] Global fetch interception is disabled; ApiClient handles auth refresh.');
  }
}

/**
 * Kept only for backward compatibility with older imports.
 * Prefer `api` / `http` from `apiClient.ts` for application API calls.
 */
export function createAuthenticatedFetch() {
  return window.fetch.bind(window);
}
