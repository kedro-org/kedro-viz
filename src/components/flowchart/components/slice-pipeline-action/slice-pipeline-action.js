import React, { Component } from 'react';
import Button from '../../../ui/button';

import './slice-pipeline-action.scss';

export const SlicePipelineAction = ({ filteredPipeline }) => {
  if (filteredPipeline.length > 0) {
    return (
      <div className="pipeline-flowchart_slice-action">
        <div className="pipeline-flowchart_slice-action--info">
          {`${filteredPipeline.length} selected`}
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
