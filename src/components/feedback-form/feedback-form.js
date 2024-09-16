import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import Button from '../ui/button';
import CloseIcon from '../icons/close';
import { Mood } from '../mood/mood';
import { getHeap } from '../../tracking';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';
import { localStorageFeedbackFirstTime } from '../../config';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';

import './feedback-form.scss';

export const FeedbackForm = ({ hideForm, title, usageContext }) => {
  const [formStatus, setFormStatus] = useState('active'); // 'active', 'submitted', 'cancelled'
  const [activeMood, setActiveMood] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const updateFormAndLocalStorage = () => {
    updateLocalStorageUsageContext(false);
    hideForm();
  };

  const handleFormAction = (action) => {
    setFormStatus(action);
    setTimeout(updateFormAndLocalStorage, 4000);
  };

  const updateLocalStorageUsageContext = (value) => {
    const existingData = loadLocalStorage(localStorageFeedbackFirstTime) || {};
    existingData[usageContext] = value;
    saveLocalStorage(localStorageFeedbackFirstTime, existingData);
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

  if (formStatus !== 'active') {
    return (
      <div className="feedback-form--wrapper feedback-form--message">
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
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleFormAction('submitted');
                  // Assuming getHeap().track(...) doesn't need to be changed or can be abstracted if necessary
                  getHeap().track(
                    getDataTestAttribute(usageContext, 'feedback-form'),
                    { rating: activeMood, feedback: feedbackText }
                  );
                }}
              >
                Submit feedback
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
};
