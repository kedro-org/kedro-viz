import React from 'react';
import classnames from 'classnames';
import Button from '../ui/button';
import CloseIcon from '../icons/close';
import { Mood } from './mood';

import './feedback-form.scss';

export const FeedbackForm = ({
  activeMood,
  isCancelled,
  feedbackText,
  isSubmitted,
  onCancel,
  onSubmit,
  setActiveMood,
  setFeedbackText,
  title,
}) => {
  const getMessages = () => {
    if (isSubmitted) {
      return 'Thank you for sharing feedback!';
    }

    if (isCancelled) {
      return (
        <>
          You can provide feedback at any time
          <br />
          by clicking on the feedback button.
        </>
      );
    }
  };
  if (isSubmitted || isCancelled) {
    return (
      <div
        className={classnames(
          'feedback-form--wrapper',
          'feedback-form--message'
        )}
      >
        {getMessages()}
      </div>
    );
  } else {
    return (
      <div
        className={classnames('feedback-form--wrapper', {
          'feedback-form--wrapper-no-form': activeMood === null,
        })}
      >
        <div className="feedback-form--close-icon" onClick={onCancel}>
          <CloseIcon />
        </div>
        <h2 className="feedback-form--title">{title}</h2>
        <div className="feedback-form">
          <Mood selectedMood={activeMood} onClick={setActiveMood} />
          {activeMood !== null && (
            <>
              <textarea
                className="feedback-form--text-area"
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                placeholder="How can we improve this feature?"
              />
              <Button type="submit" onClick={onSubmit}>
                Submit feedback
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
};
