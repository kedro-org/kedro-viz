import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import Button from '../ui/button';
import CloseIcon from '../icons/close';
import { Mood } from './mood';
import { getHeap } from '../../tracking';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

import './feedback-form.scss';

export const FeedbackForm = ({ title, onCancel, usageContext }) => {
  const [isSubmitted, setSubmitted] = useState(false);
  const [closedWithoutFeedback, setClosedWithoutFeedback] = useState(false);
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
    setClosedWithoutFeedback(true);
  };

  const getMessages = () => {
    if (isSubmitted) {
      return "Thank you for sharing feedback!"
    }

    if(closedWithoutFeedback) {
      return "You can provide feedback at any time by clicking on the feedback button."
    }
  }

  useEffect(() => {
    if(isSubmitted){
      const timer = setTimeout(() => {
        onCancel();
      }, 5000);
  
      return () => clearTimeout(timer);
    }
   
  }, [isSubmitted]);

  if (isSubmitted || closedWithoutFeedback) {
    return (
      <div className={classnames("feedback-form--wrapper", "feedback-form--message")}>
          {getMessages()}
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
            <Mood selectedMood={activeMood} onClick={setActiveMood} />
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
                    type="submit"
                    onClick={handleFormSubmit}
                  >
                    Submit feedback
                  </Button>
                </>
              )
            }
            
          </div>
      </div>
    );
  }
};
