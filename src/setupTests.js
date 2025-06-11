import '@testing-library/jest-dom';
import 'whatwg-fetch';

// src/setupTests.js
import { selection } from 'd3-selection'; // polyfills global fetch

// Mock createObjectURL for Plotly or similar libraries
window.URL.createObjectURL = jest.fn();

// Patch d3-selection to mock transition chain for testing
selection.prototype.transition = function () {
  const noop = () => this;

  return {
    duration: noop,
    style: noop,
    attr: noop,
    attrTween: noop,
    on: noop,
    ease: noop,
    remove: noop,
    select: noop,
    call(fn) {
      fn(this);
      return this;
    },
  };
};
