import React, { Component } from 'react';
import Button from '../../../ui/button';

import './slice-pipeline-action.scss';

export const SlicePipelineAction = ({ selectedNodes }) => {
  if (selectedNodes.length > 0) {
    return (
      <div className="pipeline-flowchart_slice-action">
        <div className="pipeline-flowchart_slice-action--info">
          {/* <Button> */}
          {`${selectedNodes.length} selected`}
          {/* </Button> */}
        </div>
        <div className="pipeline-flowchart_slice-action--cta">
          <Button>Slice</Button>
        </div>
      </div>
    );
  } else {
    return null;
  }
};
