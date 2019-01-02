import React from 'react';
import './description.css';
import classnames from 'classnames';
import formatTime from '../../utils/format-time';

const Description = ({ pipelineData, activePipelineData, visibleNav }) => {
  if (!pipelineData || !activePipelineData) {
    return null
  }

  const latestSync = pipelineData[0];

  return (
    <div className={classnames('snapshot-description carbon', {
      'snapshot-description--menu-visible': visibleNav
    })}>
      <p>Uploaded on: <b>{ formatTime(+activePipelineData.created_ts) }</b>
        { activePipelineData.created_ts !== latestSync.created_ts && (
          <span>outdated</span>
        ) }
      </p>
      <p>Title: <b>{ activePipelineData.message }</b></p>
    </div>
  )
}

export default Description;
