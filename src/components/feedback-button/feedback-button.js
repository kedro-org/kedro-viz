import React from 'react';
import classnames from 'classnames';

import './feedback-button.scss';

export const FeedbackButton = ({ onClick, visible }) => {
    return (
        <button 
        className={classnames('feedback-button', {
            'feedback-button--visible': visible,
        })} onClick={onClick}>
            Feedback
        </button>
    )
}