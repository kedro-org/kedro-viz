import React, { useState, useEffect } from 'react';

import { CSSTransition } from 'react-transition-group';

import './delayed-renderer.css';

const DelayedRenderer = ({ children, waitBeforeShow = 1200 }) => {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShown(true);
    }, waitBeforeShow);

    return () => clearTimeout(timer);
  }, [waitBeforeShow]);

  return (
    <CSSTransition
      classNames="fade"
      in={isShown}
      onExited={() => setIsShown(true)}
      timeout={300}
      unmountOnExit
    >
      <div>{children}</div>
    </CSSTransition>
  );
};

export default DelayedRenderer;
