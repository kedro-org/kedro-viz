import React from 'react';
import classnames from 'classnames';
import Button from '../../../ui/button';
import CommandCopier from '../../../ui/command-copier/command-copier';
import CutIcon from '../../../icons/cut';
import IconButton from '../../../ui/icon-button';
import { sidebarWidth, metaSidebarWidth } from '../../../../config';

import './sliced-pipeline-action-bar.scss';

export const SlicedPipelineActionBar = React.forwardRef((props, ref) => {
  const {
    chartSize,
    displayMetadataPanel,
    isSlicingPipelineApplied,
    onApplySlicingPipeline,
    onResetSlicingPipeline,
    runCommand,
    slicedPipeline,
    visibleSidebar,
  } = props;
  const { outerWidth: screenWidth } = chartSize;
  const buffer = 200;
  const slicePipelineActionBarWidth =
    ref.current?.firstChild.getBoundingClientRect().width;
  const metaDataPanelWidth = displayMetadataPanel
    ? metaSidebarWidth.open + buffer
    : metaSidebarWidth.open;
  const nodeListWidth = visibleSidebar
    ? sidebarWidth.open - buffer
    : sidebarWidth.open - buffer / 2;
  const minimumTransformX = visibleSidebar
    ? sidebarWidth.open
    : sidebarWidth.closed;

  // Calculate the transformX value ensuring it does not go below the minimum required for the sidebar opened and closed
  const transformX = Math.max(
    screenWidth -
      nodeListWidth -
      metaDataPanelWidth -
      slicePipelineActionBarWidth / 2,
    minimumTransformX
  );

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
            runCommand.length > 85,
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
          <span className="sliced-pipeline-action-bar--slice-text">Slice</span>
        </div>
      )}
    </div>
  );
});
