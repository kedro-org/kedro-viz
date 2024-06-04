import React from 'react';
import UrlBox from '../url-box/url-box';

const SuccessView = ({
  handleResponseUrl,
  onClick,
  responseUrl,
  showCopied,
}) => {
  return responseUrl ? (
    <div className="shareable-url-modal__result">
      <UrlBox
        url={responseUrl}
        onCopyClick={onClick}
        href={handleResponseUrl}
        showCopiedText={showCopied}
      />
    </div>
  ) : null;
};

export default SuccessView;
