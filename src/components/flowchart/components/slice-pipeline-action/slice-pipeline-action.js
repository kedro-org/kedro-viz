import React from 'react';
import Button from '../../../ui/button';

import './slice-pipeline-action.scss';

export const SlicePipelineAction = ({
  chartSize,
  filteredPipeline,
  onApplyFilters,
}) => {
  const { outerWidth, sidebarWidth } = chartSize;
  const sidebarVisible = sidebarWidth > 140;

  const transformX = sidebarVisible ? outerWidth / 2 + 100 : outerWidth / 2;
  if (filteredPipeline.length > 0) {
    return (
      <div
        className="pipeline-flowchart_slice-action"
        style={{ transform: `translateX(${transformX}px)` }}
      >
        <div className="pipeline-flowchart_slice-action--info">
          {`${filteredPipeline.length} selected`}
        </div>
        <div className="pipeline-flowchart_slice-action--cta">
          <Button onClick={onApplyFilters}>Slice</Button>
        </div>
      </div>
    );
  } else {
    return null;
  }
};
