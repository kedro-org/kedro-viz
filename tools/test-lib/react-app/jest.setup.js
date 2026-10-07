import React from 'react';
// https://github.com/plotly/react-plotly.js/issues/115
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => {};
}

// react-router v7 needs TextEncoder, which jsdom in Jest 29 doesn't provide
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  Object.assign(global, { TextEncoder, TextDecoder });
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
