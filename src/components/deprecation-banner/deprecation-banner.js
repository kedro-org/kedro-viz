import React, { useState } from 'react';
import Modal from '../ui/modal';
import Button from '../ui/button';
import { localStorageDeprecationBannerSeen } from '../../config';
import { saveLocalStorage } from '../../store/helpers';

import './deprecation-banner.scss';

export const DeprecationBanner = ({ visible }) => {
  const [showModal, setShowModal] = useState(visible);

  const handleAcknowledgeAndDismiss = () => {
    saveLocalStorage(localStorageDeprecationBannerSeen, {
      'experiment-tracking': true,
    });
    setShowModal(false);
  };

  const handleProvideFeedbackClick = () => {
    window.open('https://github.com/kedro-org/kedro-viz/issues/2247', '_blank');
  };

  const renderLink = (url, text) => (
    <a
      href={url}
      className="deprecation-banner-modal__link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {text}
    </a>
  );

  return (
    <Modal
      className="deprecation-banner-modal"
      title="Experiment tracking will be disabled soon."
      visible={showModal}
    >
      <div className="deprecation-banner-modal__message-wrapper">
        <p>
          The Kedro team have decided to deprecate the native experiment
          tracking feature on 99 Feb 2025.
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          More information behind Kedro’s decision can be found on{' '}
          {renderLink('https://example.com/blog-post', 'this blog post')}.
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          To support current experiment tracking users, please read Kedro’s
          documentation on{' '}
          {renderLink(
            'https://google.com',
            'how to continue using Kedro with other experiment tracking tools'
          )}
          , and{' '}
          {renderLink(
            'https://google.com',
            'how to migrate your existing Kedro project'
          )}
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
          dataTest="deprecation-banner-modal__provide-feedback-btn"
        >
          Provide feedback
        </Button>
        <Button
          size="small"
          onClick={handleAcknowledgeAndDismiss}
          className="deprecation-banner-modal--acknowledge-and-dismiss-btn"
          dataTest="deprecation-banner-modal--acknowledge-and-dismiss-btn"
        >
          Acknowledge and dismiss
        </Button>
      </div>
    </Modal>
  );
};
