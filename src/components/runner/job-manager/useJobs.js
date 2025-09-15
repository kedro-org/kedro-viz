import { useRef, useState, useCallback, useEffect } from 'react';
import {
  getKedroCommandStatus,
  cancelKedroCommand,
} from '../../../utils/runner-api';

// Key for persisting runner jobs across page changes
const RUNNER_JOBS_STORAGE_KEY = 'kedro_viz_runner_jobs';

function useJobs() {
  const jobPollers = useRef({});
  const logRefs = useRef({});

  const [jobs, setJobs] = useState([]);
  const [clearJobModalJobId] = useState(null);

  // --- Jobs: persistence and polling ---
  const sanitizeJobForStorage = useCallback((job) => {
    const maxLogLength = 50000;
    const safeLogs =
      typeof job.logs === 'string' ? job.logs.slice(-maxLogLength) : '';
    const stored = {
      jobId: job.jobId,
      status: job.status,
      startedAt: job.startedAt || Date.now(),
      command: job.command || 'kedro run',
      logs: safeLogs,
    };
    if (typeof job.returncode === 'number') {
      stored.returncode = job.returncode;
    }
    if (typeof job.endTime === 'number') {
      stored.endTime = job.endTime;
    }
    if (typeof job.duration !== 'undefined') {
      stored.duration = job.duration;
    }
    return stored;
  }, []);

  const saveJobsToStorage = useCallback(
    (list) => {
      try {
        const payload = (list || []).map(sanitizeJobForStorage);
        window.localStorage.setItem(
          RUNNER_JOBS_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } catch {}
    },
    [sanitizeJobForStorage]
  );

  const loadJobsFromStorage = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(RUNNER_JOBS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((j) => ({
        jobId: j.jobId,
        status: j.status || 'unknown',
        startedAt: j.startedAt || Date.now(),
        command: j.command || 'kedro run',
        logs: typeof j.logs === 'string' ? j.logs : '',
        returncode: typeof j.returncode === 'number' ? j.returncode : undefined,
        endTime: typeof j.endTime === 'number' ? j.endTime : undefined,
        duration: typeof j.duration !== 'undefined' ? j.duration : undefined,
      }));
    } catch {
      return [];
    }
  }, []);

  const addOrUpdateJob = useCallback(
    (partial) => {
      if (!partial?.jobId) {
        return;
      }
      setJobs((prev) => {
        const list = [...(prev || [])];
        const idx = list.findIndex((j) => j.jobId === partial.jobId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...partial };
        } else {
          list.unshift({
            jobId: partial.jobId,
            status: partial.status || 'initialize',
            startedAt: partial.startedAt || Date.now(),
            command: partial.command || 'kedro run',
            logs: partial.logs || '',
          });
        }
        // persist async
        setTimeout(() => saveJobsToStorage(list), 0);
        return list;
      });
    },
    [saveJobsToStorage]
  );

  const fetchJobStatus = useCallback(
    async (jobId) => {
      try {
        const {
          status,
          stdout,
          stderr,
          returncode,
          startTime,
          endTime,
          duration,
          cmd,
        } = await getKedroCommandStatus(jobId);
        const update = {
          jobId,
          status,
          returncode,
          command: cmd,
        };
        if (startTime instanceof Date && !Number.isNaN(startTime.getTime())) {
          update.startedAt = startTime.getTime();
        }
        if (endTime instanceof Date && !Number.isNaN(endTime.getTime())) {
          update.endTime = endTime.getTime();
        }
        if (typeof duration !== 'undefined') {
          update.duration = duration;
        }
        if (typeof stdout === 'string' || typeof stderr === 'string') {
          update.logs = `${stdout || ''}${
            stderr ? `\n[stderr]:\n${stderr}` : ''
          }`;
        }
        addOrUpdateJob(update);
        const isTerminal = ['finished', 'terminated', 'error'].includes(status);
        const hasFinalReturnCode = typeof returncode === 'number';
        if (isTerminal || hasFinalReturnCode) {
          const pollTimer = jobPollers.current[jobId];
          if (pollTimer) {
            clearInterval(pollTimer);
          }
          delete jobPollers.current[jobId];
        }
      } catch (err) {
        addOrUpdateJob({ jobId, status: 'error' });
        const pollTimer = jobPollers.current[jobId];
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        delete jobPollers.current[jobId];
        // eslint-disable-next-line no-console
        console.error('Failed to fetch job status', err);
      }
    },
    [addOrUpdateJob]
  );

  const startJobPolling = useCallback(
    (jobId) => {
      if (!jobId) {
        return;
      }
      if (jobPollers.current[jobId]) {
        clearInterval(jobPollers.current[jobId]);
      }
      jobPollers.current[jobId] = setInterval(() => {
        fetchJobStatus(jobId);
      }, 1000);
    },
    [fetchJobStatus]
  );

  const stopJobPolling = useCallback((jobId) => {
    const timerId = jobPollers.current[jobId];
    if (timerId) {
      clearInterval(timerId);
      delete jobPollers.current[jobId];
    }
  }, []);

  const hydrateJobsFromStorage = useCallback(() => {
    const stored = loadJobsFromStorage();
    if (!stored.length) {
      return;
    }
    setJobs(stored);
    stored.forEach((job) => {
      const isTerminal = ['finished', 'terminated', 'error'].includes(
        job.status
      );
      const hasFinalReturnCode = typeof job.returncode === 'number';
      if (
        (job.status === 'initialize' || job.status === 'running') &&
        !isTerminal &&
        !hasFinalReturnCode
      ) {
        startJobPolling(job.jobId);
      }
    });
  }, [loadJobsFromStorage, startJobPolling]);

  const addJob = useCallback(
    (job) => {
      if (!job?.jobId) {
        return;
      }
      addOrUpdateJob(job);
      startJobPolling(job.jobId);
    },
    [startJobPolling, addOrUpdateJob]
  );

  const clearJob = useCallback(
    (jobId) => {
      const id = jobId || clearJobModalJobId;
      if (!id) {
        return;
      }
      stopJobPolling(id);
      setJobs((prev) => {
        const next = (prev || []).filter((j) => j.jobId !== id);
        saveJobsToStorage(next);
        return next;
      });
    },
    [clearJobModalJobId, stopJobPolling, saveJobsToStorage]
  );

  const terminateJob = useCallback(
    (jobId) => {
      // eslint-disable-next-line no-console
      console.log('[Runner] Terminate job', jobId);
      cancelKedroCommand(jobId)
        .then(() => {
          stopJobPolling(jobId);
          addOrUpdateJob({ jobId, status: 'terminated' });
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Terminate failed', err);
        });
    },
    [stopJobPolling, addOrUpdateJob]
  );

  useEffect(() => {
    hydrateJobsFromStorage();

    return () => {
      // On unmount: clear pollers, remove popstate
      Object.values(jobPollers.current || {}).forEach((timerId) => {
        try {
          clearInterval(timerId);
        } catch (e) {}
      });
      jobPollers.current = {};
    };
  }, [hydrateJobsFromStorage]);

  return {
    jobs,
    logRefs,
    clearJob,
    terminateJob,
    addJob,
  };
}

export default useJobs;
