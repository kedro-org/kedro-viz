import React, { useState } from 'react';
import { FeedbackButton } from '../feedback-button/feedback-button';
import { FeedbackForm } from '../feedback-form/feedback-form';

export const Feedback = ({ buttonTitle, formTitle, usageContext}) => {
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);

    return (
        <>
            <FeedbackButton
                onClick={() => setShowFeedbackForm(true)}
                title={buttonTitle}
                visible={!showFeedbackForm}
            />
            {showFeedbackForm && (
                <FeedbackForm
                onCancel={() => setShowFeedbackForm(false)}
                title={formTitle}
                usageContext={usageContext}
                />
            )}
        </>
    )
}