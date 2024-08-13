import React from 'react';
import Button from '../../ui/button';

const ErrorView = ({ onClick, responseError }) => (
  <div className="shareable-url-modal__error">
    <p>Error message: {responseError}</p>
    <Button
      mode="primary"
      onClick={onClick}
      size="small"
      dataTest={'shareable-url-modal-publish-fail'}
    >
      Go back
    </Button>
  </div>
);

export default ErrorView;
