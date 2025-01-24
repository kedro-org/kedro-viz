import React from 'react';
import Modal from '../ui/modal';
import Button from '../ui/button';

import './deprecation-banner.scss';

export const DeprecationBanner = ({ visible }) => {
  const handleAcknowledgeAndDismiss = () => {};

  const handleProvideFeedbackClick = () => {
    window.open('https://github.com/kedro-org/kedro-viz/issues/2247', '_blank');
  };

  return (
    <Modal
      className="deprecation-banner-modal"
      closeModal={handleAcknowledgeAndDismiss}
      title={'Experiment tracking will be disabled soon.'}
      visible={visible}
    >
      <div className="deprecation-banner-modal__message-wrapper">
        <p>
          The Kedro team have decided to deprecate the native experiment
          tracking feature on 99 Feb 2025.
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          More information behind Kedro’s decision can be found on{' '}
          <a
            href="https://example.com/blog-post"
            className="deprecation-banner-modal__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            this blog post
          </a>
          .
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          To support current experiment tracking users, please read Kedro’s
          documentation on{' '}
          <a
            href="https://google.com"
            className="deprecation-banner-modal__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            how to continue using Kedro with other experiment tracking tools
          </a>
          , and{' '}
          <a
            href="https://google.com"
            className="deprecation-banner-modal__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            how to migrate your existing Kedro project
          </a>
          .
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          We sincerely thank our users that have utilised Kedro’s experiment
          tracking feature. If you have any further feedback for us, please feel
          free to share your thoughts below.
        </p>
      </div>

      <div className="deprecation-banner-modal__button-wrapper">
        <Button
          mode="secondary"
          onClick={handleProvideFeedbackClick}
          size="small"
          className="deprecation-banner-modal__provide-feedback-btn"
          dataTest={'deprecation-banner-modal__provide-feedback-btn'}
        >
          Provide feedback
        </Button>
        <Button
          size="small"
          onClick={handleAcknowledgeAndDismiss}
          className="deprecation-banner-modal--acknowledge-and-dismiss-btn"
          dataTest={'deprecation-banner-modal--acknowledge-and-dismiss-btn'}
        >
          Acknowledge and dismiss
        </Button>
      </div>
    </Modal>
  );
};
