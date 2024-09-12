import React, { useState, useEffect } from 'react';
import { FeedbackButton } from '../feedback-button/feedback-button';
import { FeedbackForm } from '../feedback-form/feedback-form';
import { getHeap } from '../../tracking';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

export const Feedback = ({ buttonTitle, formTitle, usageContext }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
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
  };

  const handleFormCancel = () => {
    setIsCancelled(true);
  };

  useEffect(() => {
    if (isSubmitted || isCancelled) {
      const timer = setTimeout(() => {
        setSubmitted(false);
        setIsCancelled(false);
        setShowFeedbackForm(false);
        setActiveMood(null);
        setFeedbackText('');
      }, 2000);

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
