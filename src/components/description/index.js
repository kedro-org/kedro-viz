import React from 'react';
import './description.css';
import classnames from 'classnames';
import formatTime from '../../utils/format-time';

const Description = ({ pipelineData, activePipelineData, visibleNav }) => {
  if (!pipelineData || !activePipelineData) {
    return null
  }

  return (
    <div className={classnames('snapshot-description carbon', {
      'snapshot-description--menu-visible': visibleNav
    })}>
      <p>Uploaded on: <b>{ formatTime(+activePipelineData.created_ts) }</b>
      </p>
      <p>Title: <b>{ activePipelineData.message }</b></p>
    </div>
  )
}

export default Description;
