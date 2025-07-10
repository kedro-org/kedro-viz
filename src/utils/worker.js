// Check for test environment
const isTest = typeof jest !== 'undefined';

const createWorker = () => {
  return new Worker(new URL('./graph-worker.js', import.meta.url), {
    type: 'module',
  });
};

/**
 * Emulate a worker for tests
 */
const createMockWorker = (workerModule) => {
  if (!isTest) {
    return workerModule;
  }

  return () => {
    const mockWorker = {
      terminate: () => {},
      postMessage: async (payload) => {
        const fn = workerModule.graph || workerModule.default || (() => {});
        const result = await fn(payload);
        // Simulate async message
        setTimeout(() => {
          if (typeof mockWorker.onmessage === 'function') {
            mockWorker.onmessage({ data: result });
          }
        }, 0);
      },
      onmessage: null,
    };

    return mockWorker;
  };
};

// Export the worker
export const graph = createMockWorker(createWorker);

/**
 * Prevent worker queue conflicts by ensuring only one worker runs at a time
 */
export function preventWorkerQueues(worker) {
  let instance = worker();
  let running = false;

  return (payload) => {
    if (running) {
      instance.terminate(); // Kill the previous worker
      instance = worker(); // Create a new worker
    }
    running = true;

    return new Promise((resolve) => {
      instance.onmessage = (event) => {
        running = false;
        resolve(event.data);
      };
      instance.postMessage(payload);
    });
  };
}
