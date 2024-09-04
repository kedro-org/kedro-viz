import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import Button from '../ui/button';
import CommandCopier from '../ui/command-copier/command-copier';
import CutIcon from '../icons/cut';
import IconButton from '../ui/icon-button';
import { sidebarWidth, metaSidebarWidth } from '../../config';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

import './sliced-pipeline-action-bar.scss';

/**
 * Calculate the transformX value ensuring it does not go below the minimum required for the sidebar opened and closed
 */
const calculateTransformX = ({
  screenWidth,
  slicePipelineActionBarWidth,
  metaDataPanelWidth,
  nodeListWidth,
  minimumTransformX,
}) => {
  const actionBarWidthAdjustment =
    screenWidth > 2200
      ? slicePipelineActionBarWidth
      : slicePipelineActionBarWidth / 2;
  return Math.max(
    screenWidth - nodeListWidth - metaDataPanelWidth - actionBarWidthAdjustment,
    minimumTransformX
  );
};

export const SlicedPipelineActionBar = React.forwardRef((props, ref) => {
  const {
    chartSize,
    displayMetadataPanel,
    isSlicingPipelineApplied,
    onApplySlicingPipeline,
    onResetSlicingPipeline,
    runCommand,
    slicedPipelineLength,
    visibleSidebar,
  } = props;
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    // Set a timer to change `isFirstRender` state after the component has been rendered for 500ms
    const timer = setTimeout(() => {
      setIsFirstRender(false); // Update the state after 500ms
    }, 500);

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  const { outerWidth: screenWidth } = chartSize;
  const transitionMargin = 200;
  const slicePipelineActionBarWidth =
    ref.current && ref.current.firstChild.getBoundingClientRect().width;
  const metaDataPanelWidth = displayMetadataPanel
    ? metaSidebarWidth.open + transitionMargin / 1.5
    : metaSidebarWidth.open;
  const nodeListWidth = visibleSidebar
    ? sidebarWidth.open - transitionMargin
    : sidebarWidth.open - transitionMargin / 1.5;
  const minimumTransformX = visibleSidebar
    ? sidebarWidth.open
    : sidebarWidth.closed;

  const transformX = calculateTransformX({
    screenWidth,
    slicePipelineActionBarWidth,
    metaDataPanelWidth,
    nodeListWidth,
    minimumTransformX,
  });

  return (
    <div
      className={classnames('sliced-pipeline-action-bar', {
        'sliced-pipeline-action-bar--first-render': isFirstRender,
      })}
      style={{
        transform: !isFirstRender ? `translateX(${transformX}px)` : 'none',
        left: isFirstRender ? transformX : 'auto', // Positioning adjustment on first render
        opacity: 1,
      }}
    >
      <div className="sliced-pipeline-action-bar--info">
        {`${slicedPipelineLength} selected`}
      </div>
      <div
        className={classnames('sliced-pipeline-action-bar--run-command', {
          'sliced-pipeline-action-bar--run-command-long':
            runCommand.length > 90,
        })}
      >
        <CommandCopier
          command={runCommand}
          isCommand={true}
          dataTest={getDataTestAttribute(
            'sliced-pipeline-action-bar',
            'run-command',
            'copied'
          )}
        />
      </div>
      {isSlicingPipelineApplied ? (
        <div
          className="sliced-pipeline-action-bar--cta sliced-pipeline-action-bar--reset"
          datat-test={getDataTestAttribute(
            'sliced-pipeline-action-bar',
            'reset-btn',
            'clicked'
          )}
        >
          <Button onClick={onResetSlicingPipeline}>Reset slice</Button>
        </div>
      ) : (
        <div
          className="sliced-pipeline-action-bar--cta sliced-pipeline-action-bar--slice"
          onClick={onApplySlicingPipeline}
          datat-test={getDataTestAttribute(
            'sliced-pipeline-action-bar',
            'slice-btn',
            'clicked'
          )}
        >
          <IconButton
            ariaLabel="Cut icon in slice button to slice a pipeline."
            className="cut-icon"
            icon={CutIcon}
          />
          <span className="sliced-pipeline-action-bar--slice-text">Slice</span>
        </div>
      )}
    </div>
  );
});
