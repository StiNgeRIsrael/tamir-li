/** Pull Prisma P#### codes from CLI output without logging connection strings. */
export function extractPrismaErrorCode(output: string): string | undefined {
  return output.match(/\bP\d{4}\b/)?.[0];
}

/**
 * Migration folder name from Prisma migrate CLI output.
 * Examples:
 * - The `20260624120000_ad_settings` migration failed.
 * - The `20260624120000_ad_settings` failed at …
 * - Migration name: 20260624120000_ad_settings
 */
export function extractFailedMigrationName(output: string): string | undefined {
  const backtickMatch = output.match(/`(\d{14}_[^`]+)`/);
  if (backtickMatch) {
    return backtickMatch[1];
  }

  const nameLineMatch = output.match(/Migration name:\s*(\d{14}_[^\s\r\n]+)/i);
  if (nameLineMatch) {
    return nameLineMatch[1];
  }

  const folderMatch = output.match(/\b(\d{14}_[a-z0-9_]+)\b/i);
  return folderMatch?.[1];
}

/** Trim CLI output for /health — avoid huge payloads, keep diagnostic tail. */
export function truncateCliOutput(output: string, maxLen = 2000): string {
  const trimmed = output.trim();
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLen)}…`;
}
