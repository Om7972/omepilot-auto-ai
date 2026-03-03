import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_TOKEN_SUFFIX = "-auth-token";
const AUTH_TOKEN_PREFIX = "sb-";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function clearLocalAuthStorage() {
  try {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(
      (key) => key.startsWith(AUTH_TOKEN_PREFIX) && key.endsWith(AUTH_TOKEN_SUFFIX),
    );

    if (authKey) {
      localStorage.removeItem(authKey);
    }
  } catch {
    // noop - localStorage may be unavailable in some environments
  }
}

export function isAuthNetworkError(error: unknown) {
  const authError = error as Partial<AuthError> & { status?: number };
  const message = authError?.message?.toLowerCase() || "";

  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    authError?.status === 0
  );
}

/**
 * Retries auth calls once after clearing local auth state when a transient network/session error happens.
 */
export async function withAuthRecovery<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (firstError) {
    if (!isAuthNetworkError(firstError)) {
      throw firstError;
    }

    clearLocalAuthStorage();
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    await sleep(250);

    return operation();
  }
}
