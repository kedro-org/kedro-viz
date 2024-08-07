import React from 'react';
import Button from '../../../ui/button';

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
  const slicePipelineActionBarWidth =
    ref.current && ref.current.firstChild.getBoundingClientRect().width;
  const metaDataPanelWidth = displayMetadataPanel ? 600 : 400;
  const nodeListWidth = visibleSidebar ? 200 : 400;
  const transformX =
    screenWidth -
    nodeListWidth -
    metaDataPanelWidth -
    slicePipelineActionBarWidth / 2;

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
