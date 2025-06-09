import '@testing-library/jest-dom';
import 'whatwg-fetch'; // polyfills global fetch


// Mock createObjectURL for Plotly or similar libraries
window.URL.createObjectURL = jest.fn();

// src/setupTests.js
import { selection } from 'd3-selection';

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