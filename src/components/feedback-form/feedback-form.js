import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import Button from '../ui/button';
import CloseIcon from '../icons/close';
import { Mood } from '../mood/mood';
import { getHeap } from '../../tracking';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import { localStorageFeedbackSeen } from '../../config';

import './feedback-form.scss';

export const FeedbackForm = ({ hideForm, title, usageContext }) => {
  const [formStatus, setFormStatus] = useState('active'); // 'active', 'submitted', 'cancelled'
  const [activeMood, setActiveMood] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFormAction = (action) => {
    setFormStatus(action);

    const timer = setTimeout(() => {
      updateLocalStorageUsageContext(false);
      hideForm();
    }, 4000);

    return () => clearTimeout(timer);
  };

  const updateLocalStorageUsageContext = (value) => {
    const existingData = loadLocalStorage(localStorageFeedbackSeen) || {};
    existingData[usageContext] = value;
    saveLocalStorage(localStorageFeedbackSeen, existingData);
  };

  useEffect(() => {
    if (formStatus === 'submitted' || formStatus === 'cancelled') {
      const timer = setTimeout(() => {
        setFormStatus('active');
        setActiveMood(null);
        setFeedbackText('');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [formStatus]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleFormAction('submitted');
    getHeap().track(getDataTestAttribute(usageContext, 'feedback-form'), {
      rating: activeMood,
      feedback: feedbackText,
    });
  };

  const getMessages = () => {
    if (formStatus === 'submitted') {
      return 'Thank you for sharing feedback!';
    }
    if (formStatus === 'cancelled') {
      return (
        <>
          You can provide feedback any time by using
          <br />
          the feedback button in the sliced view.
        </>
      );
    }
  };

  if (formStatus === 'submitted' || formStatus === 'cancelled') {
    return (
      <div className="feedback-form--wrapper feedback-form--message">
        {getMessages()}
      </div>
    );
  } else {
    return (
      <div
        className={classnames('feedback-form--wrapper', {
          'feedback-form--wrapper-no-text-area': activeMood === null,
        })}
      >
        <div
          className="feedback-form--close-icon"
          onClick={() => handleFormAction('cancelled')}
        >
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
              <Button type="submit" onClick={handleFormSubmit}>
                Submit feedback
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
};
