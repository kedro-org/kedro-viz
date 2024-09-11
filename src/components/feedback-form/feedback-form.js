import React, { useState } from 'react';
import Button from '../ui/button';
import { Stars } from './stars';
import { getHeap } from '../../tracking';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

import './feedback-form.scss';

export const FeedbackForm = ({ title, onCancel, usageContext }) => {
  const [isSubmitted, setSubmitted] = useState(false);
  const [starNumber, setStars] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const data = {
      rating: starNumber,
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
          <h2 className="feedback-form--title">{title}</h2>
          <div className="feedback-form">
            <Stars selectedRating={starNumber} onClick={setStars} />
            <textarea
              className="feedback-form--text-area"
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="Tell us your experience"
            />

            <div className="feedback-form--btn-wrapper">
              <Button
                mode="secondary"
                onClick={handleFormCancel}
                size="small"
                type="button"
              >
                Cancel
              </Button>
              <Button
                disabled={starNumber === 0 || !feedbackText}
                size="small"
                type="submit"
                onClick={handleFormSubmit}
              >
                Submit
              </Button>
            </div>
          </div>
      </div>
    );
  }
};
