import React from 'react';
import './description.css';
import formatTime from '../../utils/format-time';

const Description = ({ pipelineData }) => {
  const latestSync = pipelineData[0];
  return (
    <div className='snapshot-description carbon'>
        <p>Sync’d on: <b>{ formatTime(+latestSync.created_ts) }</b></p>
        <p>Title: <b>{ latestSync.message }</b></p>
    </div>
  )
}

export default Description;
