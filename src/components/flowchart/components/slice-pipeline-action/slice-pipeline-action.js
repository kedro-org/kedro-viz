import React from 'react';
import Button from '../../../ui/button';
import CommandCopier from '../../../ui/command-copier/command-copier';
import CutIcon from '../../../icons/cut';
import IconButton from '../../../ui/icon-button';

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
        <div className="pipeline-flowchart_slice-action--run-command">
          <CommandCopier command={runCommand} isCommand={true} />
        </div>
        {isFiltersApplied ? (
          <div className="pipeline-flowchart_slice-action--cta pipeline-flowchart_slice-action--reset">
            <Button onClick={onResetFilters}>Reset slice</Button>
          </div>
        ) : (
          <div
            className="pipeline-flowchart_slice-action--cta pipeline-flowchart_slice-action--slice"
            onClick={onApplyFilters}
          >
            <IconButton
              ariaLabel="Copy run command to clipboard."
              className="copy-button"
              dataHeapEvent={`clicked.run_command`}
              icon={CutIcon}
            />
            <span className="pipeline-flowchart_slice-action--slice-text">
              Slice
            </span>
          </div>
        )}
      </div>
    );
  } else {
    return null;
  }
};
