/** Thrown when POST /api/conversions or job polling returns HTTP 5xx (e.g. DB down). */
export const SERVER_UNAVAILABLE = "SERVER_UNAVAILABLE";

export function isServerUnavailableHttpStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

export function isServerUnavailableError(err: unknown): boolean {
  return err instanceof Error && err.message === SERVER_UNAVAILABLE;
}
