import React from 'react';
import './description.css';
import formatTime from '../../utils/format-time';

const Description = ({ pipelineData, activePipelineData }) => {
  if (!pipelineData || !activePipelineData) {
    return null
  }

  const latestSync = pipelineData[0];

  return (
    <div className='snapshot-description carbon'>
        <p>Uploaded on: <b>{ formatTime(+activePipelineData.created_ts) }</b>
          {activePipelineData.created_ts !== latestSync.created_ts && (
            <span>outdated</span>
          ) }
        </p>
        <p>Title: <b>{ activePipelineData.message }</b></p>
    </div>
  )
}

export default Description;
