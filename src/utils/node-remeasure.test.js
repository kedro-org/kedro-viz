import { createNodeRemeasurer } from './node-remeasure';

// A minimal element stub whose measured width we can control.
const makeEl = (width) => ({ getBoundingClientRect: () => ({ width }) });

describe('createNodeRemeasurer', () => {
  it('does not re-measure when the container is already rendered at mount', () => {
    const onReady = jest.fn();
    const remeasurer = createNodeRemeasurer(() => makeEl(800), onReady);
    remeasurer.start();
    remeasurer.check();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('re-measures exactly once when a hidden container later becomes rendered', () => {
    const onReady = jest.fn();
    let width = 0; // mounted hidden
    const remeasurer = createNodeRemeasurer(() => makeEl(width), onReady);
    remeasurer.start();
    remeasurer.check();
    expect(onReady).not.toHaveBeenCalled();
    width = 800; // becomes visible
    remeasurer.check();
    remeasurer.check(); // idempotent
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('does not re-measure while the container stays hidden', () => {
    const onReady = jest.fn();
    const remeasurer = createNodeRemeasurer(() => makeEl(0), onReady);
    remeasurer.start();
    remeasurer.check();
    remeasurer.check();
    expect(onReady).not.toHaveBeenCalled();
  });
});
