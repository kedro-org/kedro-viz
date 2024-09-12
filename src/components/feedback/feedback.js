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
    Object.keys(firstTimeSeeingFeedbackComponent).length === 0 ||
      firstTimeSeeingFeedbackComponent?.usageContext
  );
  const [isCancelled, setIsCancelled] = useState(false);
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

    // Update local storage with usage context set to false
    updateLocalStorageUsageContext(false);
  };

  const handleFormCancel = () => {
    setIsCancelled(true);
    // Update local storage with usage context set to false
    updateLocalStorageUsageContext(false);
  };

  // Utility function to update the usage context in local storage
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
