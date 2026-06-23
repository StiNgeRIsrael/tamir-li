# Conversion queue lifecycle

Server-side conversions (`POST /api/conversions`) enqueue a `ConversionJob`, store uploads on disk, and process them in-process via `startConversionWorker()` (see `backend/src/index.ts`).

## Flow

1. **Enqueue** — Client POSTs `toolId`, `fromFormat`, `toFormat`, optional file(s). API checks daily usage, creates `ConversionJob` (`PENDING`), writes input file, records `UsageLog`, returns `202` + `jobId`.
2. **Process** — Worker polls every 5s; premium jobs first. Status → `PROCESSING` → stub/passthrough output → `COMPLETED` (or `FAILED` when real converters error).
3. **Download** — `GET /api/conversions/:id/file` streams output when `COMPLETED`.
4. **Poll status** — `GET /api/conversions/:id` returns job metadata and `hasOutputFile`.

Image format tools run client-side (`src/lib/image-convert.ts`) and use `POST /api/usage/record` instead of the queue.

## TTL cleanup

Every ~30 minutes the worker runs `cleanupExpiredConversionJobs()` (`backend/src/lib/conversion-cleanup.ts`):

- Removes `COMPLETED` / `FAILED` jobs older than `CONVERSION_JOB_TTL_HOURS` (default **24**).
- Removes stale `PENDING` jobs past the same TTL (never deletes `PROCESSING`).
- Deletes the job directory under `CONVERSION_STORAGE_DIR` and the DB row.

Configure in `backend/.env`: `CONVERSION_STORAGE_DIR`, `CONVERSION_JOB_TTL_HOURS`.

## Stuck `PROCESSING` recovery

The in-process worker is single-threaded. If the Node process restarts while a job is `PROCESSING`, that row would otherwise never complete.

- **On startup** — `recoverInterruptedJobs()` resets all `PROCESSING` rows to `PENDING` so the worker picks them up again.
- **During TTL cleanup** (~every 30 min) — `cleanupStuckProcessingJobs()` marks jobs still `PROCESSING` after **`CONVERSION_JOB_STUCK_MINUTES`** (default **60**) as `FAILED` with error `Conversion timed out`.
- **Worker crash mid-job** — the `catch` block in `conversion-worker.ts` sets the job to `FAILED` immediately.

Configure in `backend/.env`: `CONVERSION_JOB_STUCK_MINUTES` (optional; default 60).
