import { graphNew } from './graph';

self.onmessage = (e) => {
  const state = e.data;
  // Perform the graph layout computation in the worker thread
  const layoutResult = graphNew(state);
  // Send the result back to the main thread
  self.postMessage(layoutResult);
};