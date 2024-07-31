import React from 'react';
import Button from '../../../ui/button';

import './sliced-pipeline-action-bar.scss';

export const SlicedPipelineActionBar = ({
  chartSize,
  slicedPipeline,
  visibleSidebar,
  notification,
}) => {
  const { outerWidth } = chartSize;

  const transformX = visibleSidebar ? outerWidth / 2 + 100 : outerWidth / 2;
  if (notification) {
    return (
      <div
        className="sliced-pipeline-action-bar notification"
        style={{ transform: `translateX(${transformX}px)` }}
      >
        <div className="sliced-pipeline-action-bar--info">
          Hold Shift + Click on another node to slice pipeline
        </div>
      </div>
    );
  } else if (slicedPipeline.length > 0) {
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
