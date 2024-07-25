import React from 'react';
import Button from '../../../ui/button';
import CommandCopier from '../../../ui/command-copier/command-copier';
import CutIcon from '../../../icons/cut';
import IconButton from '../../../ui/icon-button';

import './filtered-pipeline-action-bar.scss';

export const FilteredPipelineActionBar = ({
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
        className="filtered-pipeline-action-bar"
        style={{ transform: `translateX(${transformX}px)` }}
      >
        <div className="filtered-pipeline-action-bar--info">
          {`${filteredPipeline.length} ${
            isFiltersApplied ? 'sliced' : 'selected'
          }`}
        </div>
        <div className="filtered-pipeline-action-bar--run-command">
          <CommandCopier command={runCommand} isCommand={true} />
        </div>
        {isFiltersApplied ? (
          <div className="filtered-pipeline-action-bar--cta filtered-pipeline-action-bar--reset">
            <Button onClick={onResetFilters}>Reset slice</Button>
          </div>
        ) : (
          <div
            className="filtered-pipeline-action-bar--cta filtered-pipeline-action-bar--slice"
            onClick={onApplyFilters}
          >
            <IconButton
              ariaLabel="Copy run command to clipboard."
              className="copy-button"
              dataTest={`clicked.run_command`}
              icon={CutIcon}
            />
            <span className="filtered-pipeline-action-bar--slice-text">
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
