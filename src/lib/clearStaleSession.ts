/**
 * Proactively clears stale/corrupted Supabase auth tokens from localStorage
 * BEFORE the Supabase client initializes, preventing infinite refresh loops.
 * 
 * This runs synchronously at app startup.
 */
export function clearStaleSession() {
  try {
    // Find the Supabase auth token key in localStorage
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    
    if (!authKey) return;

    const raw = localStorage.getItem(authKey);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    
    // Check if the access token is expired
    if (parsed?.access_token) {
      try {
        const payload = JSON.parse(atob(parsed.access_token.split('.')[1]));
        const exp = payload.exp * 1000; // convert to ms
        const now = Date.now();
        
        // If token expired more than 7 days ago, the refresh token is almost certainly invalid
        // Clear the whole session to prevent the infinite retry loop
        if (now - exp > 7 * 24 * 60 * 60 * 1000) {
          console.warn('Clearing very stale auth session (expired >7 days ago)');
          localStorage.removeItem(authKey);
          return;
        }
      } catch {
        // If we can't parse the JWT, the session is corrupted — clear it
        console.warn('Clearing corrupted auth session (invalid JWT)');
        localStorage.removeItem(authKey);
        return;
      }
    }
    
    // If there's no access_token at all, the session is broken
    if (!parsed?.access_token && !parsed?.refresh_token) {
      console.warn('Clearing empty auth session');
      localStorage.removeItem(authKey);
    }
  } catch {
    // If anything goes wrong reading localStorage, just continue
  }
}
