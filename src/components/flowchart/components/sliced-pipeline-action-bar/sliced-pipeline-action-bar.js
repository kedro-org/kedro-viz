import React from 'react';
import Button from '../../../ui/button';
import { sidebarWidth, metaSidebarWidth } from '../../../../config';

import './sliced-pipeline-action-bar.scss';

/**
 * Displays a notification or action bar for slicing pipelines.
 */
export const SlicedPipelineActionBar = React.forwardRef((props, ref) => {
  const {
    chartSize,
    slicedPipeline,
    visibleSidebar,
    notification,
    displayMetadataPanel,
  } = props;
  const { outerWidth: screenWidth } = chartSize;
  const buffer = 200;
  const slicePipelineActionBarWidth =
    ref.current && ref.current.firstChild.getBoundingClientRect().width;
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

  console.log(transformX);

  return (
    <div
      className="sliced-pipeline-action-bar"
      style={{ transform: `translateX(${transformX}px)` }}
    >
      <div className="sliced-pipeline-action-bar--info">
        {notification
          ? 'Hold Shift + Click on another node to slice pipeline'
          : `${slicedPipeline.length} selected`}
      </div>
      {!notification && (
        <div className="sliced-pipeline-action-bar--cta">
          <Button>Slice</Button>
        </div>
      )}
    </div>
  );
});
