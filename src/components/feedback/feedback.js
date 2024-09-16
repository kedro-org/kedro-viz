import React, { useState, useEffect } from 'react';
import { FeedbackButton } from '../feedback-button/feedback-button';
import { FeedbackForm } from '../feedback-form/feedback-form';
import { getHeap } from '../../tracking';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';
import { localStorageFeedbackFirstTime } from '../../config';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';

export const Feedback = ({ buttonTitle, formTitle, usageContext }) => {
  const firstTimeSeeingFeedbackComponent = loadLocalStorage(
    localStorageFeedbackFirstTime
  );
  const [showFeedbackForm, setShowFeedbackForm] = useState(
    firstTimeSeeingFeedbackComponent?.usageContext
  );

  const [isCancelled, setIsCancelled] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);
  const [activeMood, setActiveMood] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    setTimeout(() => {
      if (Object.keys(firstTimeSeeingFeedbackComponent).length === 0) {
        updateLocalStorageUsageContext(true);
        setShowFeedbackForm(true);
      }
    }, 4000);
  }, [firstTimeSeeingFeedbackComponent]);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const data = {
      rating: activeMood,
      feedback: feedbackText,
    };

    getHeap().track(getDataTestAttribute(usageContext, 'feedback-form'), data);
    setSubmitted(true);

    updateLocalStorageUsageContext(false);
  };

  const handleFormCancel = () => {
    setIsCancelled(true);
    updateLocalStorageUsageContext(false);
  };

  // to update the usage context in local storage
  const updateLocalStorageUsageContext = (value) => {
    // Load existing data or initialize to an empty object if null
    const existingData = loadLocalStorage(localStorageFeedbackFirstTime) || {};
    existingData[usageContext] = value;
    saveLocalStorage(localStorageFeedbackFirstTime, existingData);
  };

  useEffect(() => {
    if (isSubmitted || isCancelled) {
      const timer = setTimeout(() => {
        setSubmitted(false);
        setIsCancelled(false);
        setShowFeedbackForm(false);
        setActiveMood(null);
        setFeedbackText('');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isSubmitted, isCancelled]);

  return (
    <>
      <FeedbackButton
        onClick={() => setShowFeedbackForm(true)}
        title={buttonTitle}
        visible={!showFeedbackForm}
      />
      {showFeedbackForm && (
        <FeedbackForm
          activeMood={activeMood}
          isCancelled={isCancelled}
          feedbackText={feedbackText}
          isSubmitted={isSubmitted}
          onCancel={handleFormCancel}
          onSubmit={handleFormSubmit}
          setActiveMood={setActiveMood}
          setFeedbackText={setFeedbackText}
          title={formTitle}
        />
      )}
    </>
  );
};
