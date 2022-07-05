import React from 'react';
import { Transition } from 'react-transition-group';

const directions = {
  leftToRight: {
    entering: {
      opacity: 0.5,
      transform: 'translateX(50%)',
      visibility: 'visible',
    },
    entered: {
      opacity: 1,
      transform: 'translateX(50%)',
      visibility: 'visible',
    },
    exiting: {
      transform: 'translateX(-50%)',
      opacity: 0.5,
      visibility: 'hidden',
    },
    exited: {
      transform: 'translateX(-50%)',
      opacity: 0,
      visibility: 'hidden',
    },
  },
  rightToLeft: {
    entering: {
      opacity: 0.5,
      transform: 'translateX(-50%)',
      visibility: 'visible',
    },
    entered: {
      opacity: 1,
      transform: 'translateX(-50%)',
      visibility: 'visible',
    },
    exiting: {
      transform: 'translateX(50%)',
      opacity: 0.5,
      visibility: 'hidden',
    },
    exited: {
      transform: 'translateX(50%)',
      opacity: 0,
      visibility: 'hidden',
    },
  },
};

export const SlideFromLeftToRight = ({ state, duration, children }) => {
  const defaultStyle = {
    transition: `transform ${duration}ms ease-in-out`,
  };

  return (
    <Transition in={state} timeout={duration}>
      {(state) => (
        <div
          style={{
            ...defaultStyle,
            ...directions['leftToRight'][state],
          }}
        >
          {children}
        </div>
      )}
    </Transition>
  );
};

export const SlideFromRightToLeft = ({ state, duration, children }) => {
  const defaultStyle = {
    transition: `transform ${duration}ms ease-in-out`,
  };

  return (
    <Transition in={state} timeout={duration}>
      {(state) => (
        <div
          style={{
            ...defaultStyle,
            ...directions['rightToLeft'][state],
          }}
        >
          {children}
        </div>
      )}
    </Transition>
  );
};
