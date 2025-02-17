import React, { useState } from 'react';
import Modal from '../ui/modal';
import Button from '../ui/button';
import { localStorageETDeprecationBannerSeen } from '../../config';

import './deprecation-banner.scss';

export const DeprecationBanner = () => {
  const visible = !window.localStorage.getItem(
    localStorageETDeprecationBannerSeen
  );
  const [showModal, setShowModal] = useState(visible);

  const handleAcknowledgeAndDismiss = () => {
    window.localStorage.setItem(localStorageETDeprecationBannerSeen, true);
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
          We have decided to deprecate experiment tracking feature from
          Kedro-Viz version 11.0.0
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          Find out more from{' '}
          {renderLink(
            'https://kedro.org/blog/deprecate-experiment-tracking-kedro-viz',
            'this blog post'
          )}
          .
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          Our documentation explains{' '}
          {renderLink(
            'https://docs.kedro.org/en/stable/integrations/mlflow.html',
            'how to continue using Kedro with MLflow for experiment tracking '
          )}
          and{' '}
          {renderLink(
            'https://docs.kedro.org/projects/kedro-viz/en/latest/migrate_experiment_tracking.html',
            'how to migrate a Kedro project accordingly'
          )}
          .
        </p>

        <p className="deprecation-banner-modal__secondary-text">
          If you have any further feedback for us, feel free to share your
          thoughts below.
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
