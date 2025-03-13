// https://github.com/plotly/react-plotly.js/issues/115
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => {};
}

import '@testing-library/jest-dom';

// Mock Web Workers in Jest
global.Worker = class {
  constructor() {
    this.onmessage = () => {}; // Default handler
  }

  postMessage(msg) {
    setTimeout(() => this.onmessage({ data: { mockData: "worker response" } }), 10);
  }

  terminate() {}
};