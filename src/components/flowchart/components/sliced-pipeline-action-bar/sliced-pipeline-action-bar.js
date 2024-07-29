import React from 'react';
import classnames from 'classnames';
import Button from '../../../ui/button';
import CommandCopier from '../../../ui/command-copier/command-copier';
import CutIcon from '../../../icons/cut';
import IconButton from '../../../ui/icon-button';

import './sliced-pipeline-action-bar.scss';

export const SlicedPipelineActionBar = ({
  chartSize,
  slicedPipeline,
  isSlicingPipelineApplied,
  onApplySlicingPipeline,
  onResetSlicingPipeline,
  runCommand,
}) => {
  const { outerWidth, sidebarWidth } = chartSize;
  const sidebarVisible = sidebarWidth > 140;

  const transformX = sidebarVisible ? outerWidth / 2.5 : outerWidth / 3;
  if (slicedPipeline.length > 0) {
    return (
      <div
        className="sliced-pipeline-action-bar"
        style={{ transform: `translateX(${transformX}px)` }}
      >
        <div className="sliced-pipeline-action-bar--info">
          {`${slicedPipeline.length} ${
            isSlicingPipelineApplied ? 'sliced' : 'selected'
          }`}
        </div>
        <div
          className={classnames('sliced-pipeline-action-bar--run-command', {
            'sliced-pipeline-action-bar--run-command-long':
              runCommand.length > 90,
          })}
        >
          <CommandCopier command={runCommand} isCommand={true} />
        </div>
        {isSlicingPipelineApplied ? (
          <div className="sliced-pipeline-action-bar--cta sliced-pipeline-action-bar--reset">
            <Button onClick={onResetSlicingPipeline}>Reset slice</Button>
          </div>
        ) : (
          <div
            className="sliced-pipeline-action-bar--cta sliced-pipeline-action-bar--slice"
            onClick={onApplySlicingPipeline}
          >
            <IconButton
              ariaLabel="Copy run command to clipboard."
              className="copy-button"
              dataTest={`clicked.run_command`}
              icon={CutIcon}
            />
            <span className="sliced-pipeline-action-bar--slice-text">
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
