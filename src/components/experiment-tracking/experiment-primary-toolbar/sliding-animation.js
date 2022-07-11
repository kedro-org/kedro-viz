import React from 'react';
import { Transition } from 'react-transition-group';

const directions = {
  leftToRight: {
    entering: {
      transform: 'translateX(0)',
      visibility: 'visible',
      opacity: '0.75',
    },
    entered: {
      transform: 'translateX(0)',
      visibility: 'visible',
      opacity: '1',
    },
    exiting: {
      transform: 'translateX(-34%)',
      visibility: 'hidden',
      opacity: '1',
    },
    exited: {
      transform: 'translateX(-34%)',
      visibility: 'hidden',
      opacity: '0.75',
    },
  },
  rightToLeft: {
    entering: {
      transform: 'translateX(0)',
      visibility: 'visible',
      opacity: '0.75',
    },
    entered: {
      transform: 'translateX(0)',
      visibility: 'visible',
      opacity: '1',
    },
    exiting: {
      transform: 'translateX(34%)',
      visibility: 'hidden',
      opacity: '1',
    },
    exited: {
      transform: 'translateX(34%)',
      visibility: 'hidden',
      opacity: '0.75',
    },
  },
};

export const Animation = ({ children, direction, duration, state }) => {
  const defaultStyle = {
    transition: `transform 0.15s ease-out 0s, opacity 0.15s linear 0s`,
    opacity: '0',
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
