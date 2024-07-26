import React from 'react';
import Button from '../../../ui/button';

import './sliced-pipeline-action-bar.scss';

export const SlicedPipelineActionBar = ({ chartSize, slicedPipeline }) => {
  const { outerWidth, sidebarWidth } = chartSize;
  const sidebarVisible = sidebarWidth > 140;

  const transformX = sidebarVisible ? outerWidth / 2 + 100 : outerWidth / 2;
  if (slicedPipeline.length > 0) {
    return (
      <div
        className="sliced-pipeline-action-bar"
        style={{ transform: `translateX(${transformX}px)` }}
      >
        <div className="sliced-pipeline-action-bar--info">
          {`${slicedPipeline.length} selected`}
        </div>
        <div className="sliced-pipeline-action-bar--cta">
          <Button>Slice</Button>
        </div>
      </div>
    );
  } else {
    return null;
  }
};
