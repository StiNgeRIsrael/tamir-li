export const MAX_FILE_SIZE_MB_FREE = 50;
export const MAX_FILE_SIZE_MB_PREMIUM = 200;
export const MAX_BATCH_FILES_FREE = 1;
/** Practical upper bound for UI file-picker batching; premium has no enforced cap. */
export const MAX_BATCH_FILES_PREMIUM = Number.MAX_SAFE_INTEGER;

export const MAX_FILE_BYTES_FREE = MAX_FILE_SIZE_MB_FREE * 1024 * 1024;
export const MAX_FILE_BYTES_PREMIUM = MAX_FILE_SIZE_MB_PREMIUM * 1024 * 1024;

export function maxFileSizeMb(isPremium: boolean): number {
  return isPremium ? MAX_FILE_SIZE_MB_PREMIUM : MAX_FILE_SIZE_MB_FREE;
}

export function maxFileBytes(isPremium: boolean): number {
  return isPremium ? MAX_FILE_BYTES_PREMIUM : MAX_FILE_BYTES_FREE;
}

export function maxBatchFiles(isPremium: boolean): number {
  return isPremium ? MAX_BATCH_FILES_PREMIUM : MAX_BATCH_FILES_FREE;
}

export type FileRejectReason = "file_too_large" | "batch_limit";

export function filterFilesForTier(
  files: File[],
  options: { isPremium: boolean; existingCount?: number }
): { accepted: File[]; rejected: Array<{ reason: FileRejectReason; fileName?: string }> } {
  const maxBytes = maxFileBytes(options.isPremium);
  const maxFiles = maxBatchFiles(options.isPremium);
  const existing = options.existingCount ?? 0;
  const accepted: File[] = [];
  const rejected: Array<{ reason: FileRejectReason; fileName?: string }> = [];

  for (const file of files) {
    if (file.size > maxBytes) {
      rejected.push({ reason: "file_too_large", fileName: file.name });
      continue;
    }
    if (existing + accepted.length >= maxFiles) {
      rejected.push({ reason: "batch_limit" });
      break;
    }
    accepted.push(file);
  }

  return { accepted, rejected };
}
