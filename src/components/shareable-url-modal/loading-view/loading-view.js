import React from 'react';
import LoadingIcon from '../../icons/loading';

const LoadingView = ({ isLoading }) => (
  <div className="shareable-url-modal__loading">
    <LoadingIcon visible={isLoading} />
  </div>
);

export default LoadingView;
