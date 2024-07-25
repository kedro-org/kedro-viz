import React from 'react';
import Button from '../../../ui/button';

import './filtered-pipeline-action-bar.scss';

export const FilteredPipelineActionBar = ({ chartSize, filteredPipeline }) => {
  const { outerWidth, sidebarWidth } = chartSize;
  const sidebarVisible = sidebarWidth > 140;

  const transformX = sidebarVisible ? outerWidth / 2 + 100 : outerWidth / 2;
  if (filteredPipeline.length > 0) {
    return (
      <div
        className="filtered-pipeline-action-bar"
        style={{ transform: `translateX(${transformX}px)` }}
      >
        <div className="filtered-pipeline-action-bar--info">
          {`${filteredPipeline.length} selected`}
        </div>
        <div className="filtered-pipeline-action-bar--cta">
          <Button>Slice</Button>
        </div>
      </div>
    );
  } else {
    return null;
  }
};
