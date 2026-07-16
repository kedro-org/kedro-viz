import React from 'react';
// https://github.com/plotly/react-plotly.js/issues/115
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => {};
}

global.fetch = require('node-fetch');

jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(() => Promise.resolve({ svg: '<svg></svg>' })),
    parse: jest.fn(() => Promise.resolve()),
    run: jest.fn(() => Promise.resolve()),
    contentLoaded: jest.fn(),
  },
}));
