import React from 'react';
import ExpandIcon from '../icons/expand';

/**
 * Wrapper component for preview renderers with consistent styling and expand button
 */
const PreviewWrapper = ({
  children,
  onExpand,
  className = 'pipeline-metadata__preview',
  showShadows = true,
  onClick,
}) => {
  return (
    <>
      <div className={className} onClick={onClick}>
        {showShadows && (
          <>
            <div className="scrollable-container">{children}</div>
            <div className="pipeline-metadata__preview-shadow-box-right" />
            <div className="pipeline-metadata__preview-shadow-box-bottom" />
          </>
        )}
        {!showShadows && children}
      </div>
      <button className="pipeline-metadata__link" onClick={onExpand}>
        <ExpandIcon className="pipeline-metadata__link-icon" />
        <span className="pipeline-metadata__link-text">Expand preview</span>
      </button>
    </>
  );
};

export default PreviewWrapper;
