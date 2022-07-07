import React from 'react';
import { Transition } from 'react-transition-group';

const directions = {
  leftToRight: {
    entering: {
      transform: 'translateX(50%)',
      visibility: 'visible',
    },
    entered: {
      transform: 'translateX(50%)',
      visibility: 'visible',
    },
    exiting: {
      transform: 'translateX(-50%)',
      visibility: 'hidden',
    },
    exited: {
      transform: 'translateX(-50%)',
      visibility: 'hidden',
    },
  },
  rightToLeft: {
    entering: {
      transform: 'translateX(-50%)',
      visibility: 'visible',
    },
    entered: {
      transform: 'translateX(-50%)',
      visibility: 'visible',
    },
    exiting: {
      transform: 'translateX(50%)',
      visibility: 'hidden',
    },
    exited: {
      transform: 'translateX(50%)',
      visibility: 'hidden',
    },
  },
};

export const Animation = ({ children, direction, duration, state }) => {
  const defaultStyle = {
    transition: `transform ${duration}ms ease-in-out`,
  };

  return (
    <Transition in={state} timeout={duration}>
      {(state) => (
        <div
          style={{
            ...defaultStyle,
            ...directions[direction][state],
          }}
        >
          {children}
        </div>
      )}
    </Transition>
  );
};

export const SlideFromLeftToRight = ({ state, duration, children }) => {
  return (
    <Animation
      children={children}
      direction="leftToRight"
      duration={duration}
      state={state}
    />
  );
};

export const SlideFromRightToLeft = ({ state, duration, children }) => {
  return (
    <Animation
      children={children}
      direction="rightToLeft"
      duration={duration}
      state={state}
    />
  );
};
