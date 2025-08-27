// Vite turns this into a Worker constructor.
import GraphWorker from './graph-worker.js?worker&inline';

// Check for test environment
const isTest = typeof jest !== 'undefined';

// Factory that returns a Worker instance
const createWorker = () => new GraphWorker({ name: 'graph-worker' });

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
        // For tests, call the worker module directly
        const impl = require('./graph-worker.js');
        const fn = impl.graph || impl.default || (() => {});
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
