import { noop } from 'lodash';

export const getHeap = () => {
  if (!window.heap) {
    window.heap = {
      track: noop,
    };
  }

  return window.heap;
};
