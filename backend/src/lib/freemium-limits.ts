export const MAX_FILE_SIZE_MB_FREE = 50;
export const MAX_FILE_SIZE_MB_PREMIUM = 200;
export const MAX_BATCH_FILES_FREE = 1;

export const MAX_FILE_BYTES_FREE = MAX_FILE_SIZE_MB_FREE * 1024 * 1024;
export const MAX_FILE_BYTES_PREMIUM = MAX_FILE_SIZE_MB_PREMIUM * 1024 * 1024;

export function maxFileBytes(isPremium: boolean): number {
  return isPremium ? MAX_FILE_BYTES_PREMIUM : MAX_FILE_BYTES_FREE;
}
