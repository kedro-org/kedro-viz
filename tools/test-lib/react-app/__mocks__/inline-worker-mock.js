// Satisfies require('./graph-worker.js') inside the CJS bundle during tests
module.exports = function InlineWorkerMock() {
  this.onmessage = null;
  this.postMessage = function () {};
  this.terminate = function () {};
  return this;
};
