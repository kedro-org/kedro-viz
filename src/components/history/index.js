import React from 'react';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import './history.css';
import formatTime from '../../utils/format-time';

const History = ({ activePipelineData, pipelineData, onChangeActivePipeline, theme }) => (
  <ul className='pipeline-history'>
    { pipelineData.map(d =>
      <li key={d.created_ts}>
        <RadioButton
          checked={activePipelineData.created_ts === d.created_ts}
          label={(
            <span className='pipeline-history__label'>
              <b>{ d.message }</b> <span>{ formatTime(+d.created_ts) }</span>
            </span>
          )}
          name='history'
          onChange={() => onChangeActivePipeline(d)}
          value={d.created_ts}
          theme={theme} />
      </li>
    ) }
  </ul>
)

export default History;
