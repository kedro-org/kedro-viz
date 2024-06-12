import React from 'react';
import Button from '../../ui/button';

const ErrorView = ({ onClick, responseError }) => (
  <div className="shareable-url-modal__error">
    <p>Error message: {responseError}</p>
    <Button mode="primary" onClick={onClick} size="small">
      Go back
    </Button>
  </div>
);

export default ErrorView;
