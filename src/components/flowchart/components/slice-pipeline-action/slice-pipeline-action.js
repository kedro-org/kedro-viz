import React from 'react';
import Button from '../../../ui/button';

import './slice-pipeline-action.scss';

export const SlicePipelineAction = ({
  chartSize,
  filteredPipeline,
  isFiltersApplied,
  onApplyFilters,
  onResetFilters,
  runCommand,
}) => {
  const { outerWidth, sidebarWidth } = chartSize;
  const sidebarVisible = sidebarWidth > 140;

  const transformX = sidebarVisible ? outerWidth / 2.5 : outerWidth / 3;
  if (filteredPipeline.length > 0) {
    return (
      <div
        className="pipeline-flowchart_slice-action"
        style={{ transform: `translateX(${transformX}px)` }}
      >
        <div className="pipeline-flowchart_slice-action--info">
          {`${filteredPipeline.length} selected`}
        </div>
        <div className="pipeline-flowchart_slice-action--info">
          {runCommand}
        </div>
        {isFiltersApplied ? (
          <div className="pipeline-flowchart_slice-action--cta pipeline-flowchart_slice-action--reset">
            <Button onClick={onResetFilters}>Reset</Button>
          </div>
        ) : (
          <div className="pipeline-flowchart_slice-action--cta">
            <Button onClick={onApplyFilters}>Slice</Button>
          </div>
        )}
      </div>
    );
  } else {
    return null;
  }
};
