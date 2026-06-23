import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl, responseLooksLikeJson } from "@/lib/api/client";
import { isServerUnavailableHttpStatus, SERVER_UNAVAILABLE } from "@/lib/conversion-errors";

export type ConversionJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type StartJobParams = {
  toolId: string;
  fromFormat: string;
  toFormat: string;
  files: File[];
};

export type StartJobResult =
  | { kind: "enqueued"; jobId: string; outputBlob?: Blob }
  | { kind: "not_ready" };

type JobResponse = {
  id: string;
  status: ConversionJobStatus;
  errorMessage?: string | null;
  hasOutputFile?: boolean;
};

const POLL_INTERVAL_MS = 2000;
/** ~5 min cap so a stuck job cannot poll forever. */
const MAX_POLL_ATTEMPTS = 150;

function getAuthHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem("tamir_auth_token");
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* private mode */
  }
  return {};
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadJobFile(api: string, id: string): Promise<Blob | null> {
  const res = await fetch(`${api}/api/conversions/${id}/file`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("JOB_DOWNLOAD_FAILED");
  return res.blob();
}

export function useConversionJob() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConversionJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = true;
    setJobId(null);
    setStatus(null);
    setError(null);
    setPolling(false);
  }, []);

  const pollUntilDone = useCallback(async (api: string, id: string): Promise<JobResponse> => {
    abortRef.current = false;
    setPolling(true);

    let attempts = 0;
    while (!abortRef.current) {
      if (++attempts > MAX_POLL_ATTEMPTS) {
        setPolling(false);
        setError("JOB_POLL_TIMEOUT");
        throw new Error("JOB_POLL_TIMEOUT");
      }

      const res = await fetch(`${api}/api/conversions/${id}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (!responseLooksLikeJson(res)) {
        throw new Error("JOB_POLL_INVALID_RESPONSE");
      }
      if (!res.ok) {
        throw new Error(isServerUnavailableHttpStatus(res.status) ? SERVER_UNAVAILABLE : "JOB_POLL_FAILED");
      }

      const job = (await res.json()) as JobResponse;
      setStatus(job.status);

      if (job.status === "COMPLETED") {
        setPolling(false);
        return job;
      }
      if (job.status === "FAILED") {
        setPolling(false);
        setError(job.errorMessage ?? "CONVERSION_FAILED");
        throw new Error(job.errorMessage ?? "CONVERSION_FAILED");
      }

      await sleep(POLL_INTERVAL_MS);
    }

    throw new Error("JOB_ABORTED");
  }, []);

  const startJob = useCallback(
    async (params: StartJobParams): Promise<StartJobResult> => {
      const api = getApiBaseUrl();
      if (!api) {
        setError("NO_API");
        throw new Error("NO_API");
      }

      abortRef.current = false;
      setJobId(null);
      setStatus(null);
      setError(null);
      setPolling(true);

      const fd = new FormData();
      fd.append("toolId", params.toolId);
      fd.append("fromFormat", params.fromFormat);
      fd.append("toFormat", params.toFormat);
      for (const file of params.files) {
        fd.append("files", file);
      }
      const totalBytes = params.files.reduce((sum, f) => sum + f.size, 0);
      fd.append("fileSizeBytes", String(totalBytes));

      const res = await fetch(`${api}/api/conversions`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (res.status === 501) {
        setPolling(false);
        return { kind: "not_ready" };
      }

      if (isServerUnavailableHttpStatus(res.status)) {
        setPolling(false);
        setError(SERVER_UNAVAILABLE);
        throw new Error(SERVER_UNAVAILABLE);
      }

      if (!responseLooksLikeJson(res)) {
        setPolling(false);
        setError("API_ERROR");
        throw new Error("API_ERROR");
      }

      if (res.status === 202) {
        const body = (await res.json()) as { jobId?: string; status?: ConversionJobStatus };
        if (!body.jobId) {
          setPolling(false);
          setError("INVALID_RESPONSE");
          throw new Error("INVALID_RESPONSE");
        }
        setJobId(body.jobId);
        setStatus(body.status ?? "PENDING");
        await pollUntilDone(api, body.jobId);
        const outputBlob = await downloadJobFile(api, body.jobId).catch(() => null);
        return { kind: "enqueued", jobId: body.jobId, outputBlob: outputBlob ?? undefined };
      }

      setPolling(false);
      const errBody = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      const msg = errBody.message ?? errBody.error ?? "API_ERROR";
      setError(msg);
      throw new Error(msg);
    },
    [pollUntilDone]
  );

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return {
    jobId,
    status,
    error,
    polling,
    startJob,
    reset,
  };
}
