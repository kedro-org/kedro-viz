import React, { useState } from 'react';
import Modal from '../ui/modal';
import Button from '../ui/button';
import { Stars } from './stars';
import { callSlack } from '../../utils';

import './feedback-form.scss';

export const FeedbackForm = ({ title, onClose }) => {
    const [isSubmitted, setSubmitted] = useState(false);
    const [isTextareaActive, setTextareaActivity] = useState(false);
    const [starNumber, setStars] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
      
        if (starNumber === 0 || !feedbackText) {
          return;
        }
      
        const data = {
          text: `Feedback: ${feedbackText}\nRating: ${starNumber} stars`
        };
        
        try {
            const request = await callSlack({
                data
              });
        
            if (request.ok) {
                alert('Feedback submitted successfully');
                setSubmitted(true);
            }
        } catch (error) {
          alert('Feedback submission failed');
          console.error('Error submitting feedback:', error);
        }
    };


  // Function to handle input changes
  const handleTextArea = (event) => {
    setFeedbackText(event.target.value);
  };

  console.log(starNumber, 'starNumber')

  if (isSubmitted) {
    return (
        <div className="feedback-form--wrapper">
            <Modal closeModal={onClose} title={title} visible={true}>
                Thank you for submitting your feedback! 🙏
            </Modal>
    </div>
    )
  } else {
    return (
        <div className="feedback-form--wrapper">
          <Modal closeModal={onClose} title={title} visible={true}>
            <Stars 
                selectedRating={starNumber}
                onClick={setStars}
            />
    
            <form className='feedback-form--text-area'>
              <textarea
                value={feedbackText}
                onChange={handleTextArea}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none' }}
                rows="4"
                placeholder="Tell us your experience"
              />
              <Button type="submit" size='small' onClick={onSubmit}>Submit</Button>
            </form>
          </Modal>
        </div>
      );
  }
};
