import { sanitizedPathname } from '../utils';

const apiBase = () => `${sanitizedPathname()}api`;

export const startKedroCommand = async (command) => {
  // Backend expects a simple 'command' parameter (treated as query by FastAPI for simple types)
  const url = `${apiBase()}/run-kedro-command?command=${encodeURIComponent(
    command
  )}`;
  const res = await fetch(url, { method: 'POST' });
  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    // ignore non-JSON responses
  }
  return {
    jobId: json.job_id || json.jobId,
    status: json.status || (res.status === 202 ? 'initialize' : 'unknown'),
  };
};

export const getKedroCommandStatus = async (jobId) => {
  const timestamp = Date.now();
  const url = `${apiBase()}/kedro-command-status/${encodeURIComponent(
    jobId
  )}?_=${timestamp}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) {
    return { status: 'not_found' };
  }
  const data = await res.json().catch(() => ({}));
  // Normalize transient statuses for the UI
  let status = data.status || (res.status === 202 ? 'running' : 'unknown');
  if (status === 'initialize') {
    status = 'running';
  }
  return {
    status,
    stdout: typeof data.stdout === 'string' ? data.stdout : undefined,
    stderr: typeof data.stderr === 'string' ? data.stderr : undefined,
    startTime: data.start_time ? new Date(data.start_time) : undefined,
    endTime: data.end_time ? new Date(data.end_time) : undefined,
    duration: data.duration ? data.duration : undefined,
    cmd: data.cmd || undefined,
    returncode:
      typeof data.returncode !== 'undefined' ? data.returncode : undefined,
  };
};

export const cancelKedroCommand = async (jobId) => {
  const res = await fetch(
    `${apiBase()}/kedro-command-cancel/${encodeURIComponent(jobId)}`,
    {
      method: 'POST',
    }
  );
  return res.ok;
};
