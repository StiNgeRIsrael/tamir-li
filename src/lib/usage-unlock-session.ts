const SESSION_KEY = "tamir_usage_unlocked";

/** Session-scoped unlock after watching a rewarded ad on the daily limit gate. */
export function isUsageUnlockedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markUsageUnlockedThisSession(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearUsageUnlockSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
}
