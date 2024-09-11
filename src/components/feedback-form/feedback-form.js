import React, { useState } from 'react';
import Button from '../ui/button';
import CloseIcon from '../icons/close';
import { Mood } from './mood';
import { getHeap } from '../../tracking';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

import './feedback-form.scss';

export const FeedbackForm = ({ title, onCancel, usageContext }) => {
  const [isSubmitted, setSubmitted] = useState(false);
  const [activeMood, setActiveMood] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const data = {
      rating: activeMood,
      feedback: feedbackText,
    };

    getHeap().track(getDataTestAttribute(usageContext, 'feedback-form'), data);
    setSubmitted(true);
  };

  const handleFormCancel = () => {
    onCancel();
    setSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="feedback-form--wrapper">
          Thank you for submitting your feedback! 🙏
      </div>
    );
  } else {
    return (
      <div className="feedback-form--wrapper">
          <div className="feedback-form--close-icon" onClick={handleFormCancel}>
            <CloseIcon/>
          </div>
          <h2 className="feedback-form--title">{title}</h2>
          <div className="feedback-form">
            <Mood activeMood={activeMood} onClick={(mood) => setActiveMood(mood)} />
            {
              activeMood !== null &&  (
                <>
                  <textarea
                    className="feedback-form--text-area"
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    placeholder="How can we improve this feature?"
                  />
                  <Button
                    size="small"
                    type="submit"
                    onClick={handleFormSubmit}
                  >
                    Submit
                  </Button>
                </>
              )
            }
            
          </div>
      </div>
    );
  }
};
