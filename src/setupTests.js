import '@testing-library/jest-dom';
import 'whatwg-fetch';

// src/setupTests.js
import { selection } from 'd3-selection'; // polyfills global fetch

// Mock createObjectURL for Plotly or similar libraries
window.URL.createObjectURL = jest.fn();

// Mock mermaid library to avoid ESM import issues
jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn((id, code) => Promise.resolve({ svg: '<svg></svg>' })),
    parse: jest.fn(() => Promise.resolve()),
    run: jest.fn(() => Promise.resolve()),
    contentLoaded: jest.fn(),
  },
}));

// Patch d3-selection to mock transition chain for testing
selection.prototype.transition = function () {
  return {
    duration() {
      return this;
    },
    style() {
      return this;
    },
    attr() {
      return this;
    },
    attrTween() {
      return this;
    },
    call(fn) {
      fn(this);
      return this;
    },
    on() {
      return this;
    },
    ease() {
      return this;
    },
    remove() {
      return this;
    },
    select() {
      return this;
    },
  };
};
