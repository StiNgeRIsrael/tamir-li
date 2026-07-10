/** Tracks whether the user already watched the post-convert ad hold this session — skips redundant download gates. */

const SESSION_KEY = "tamir_post_convert_ad_ok";

export function markPostConvertAdSatisfied(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function isPostConvertAdSatisfied(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPostConvertAdSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
}
