import React from 'react';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import './history.css';

const time = datetime => {
  const d = new Date(datetime);
  return `${d.toDateString()} ${d.toLocaleTimeString()}`;
}

const History = ({ activeData, data, onChangeActivePipeline, theme }) => (
  <ul className='pipeline-history'>
    { data.map(d =>
      <li key={d.created_ts}>
        <RadioButton
          checked={activeData.created_ts === d.created_ts}
          label={(
            <span className='pipeline-history__label'>
              <b>{ d.message }</b> <span>{ time(+d.created_ts) }</span>
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
