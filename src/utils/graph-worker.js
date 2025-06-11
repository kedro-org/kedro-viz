/* eslint-disable no-restricted-globals */
import { graphNew } from './graph/index.js';

self.addEventListener('message', (event) => {
  const state = event.data;
  const layoutResult = graphNew(state);
  self.postMessage(layoutResult);
});
