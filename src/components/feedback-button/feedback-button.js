import React from 'react';
import classnames from 'classnames';

import './feedback-button.scss';

export const FeedbackButton = ({ onClick, visible, title }) => {
  return (
    <button
      className={classnames('feedback-button', {
        'feedback-button--visible': visible,
      })}
      onClick={onClick}
    >
      {title}
    </button>
  );
};
