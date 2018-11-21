import React from 'react';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import './history.css';

const time = datetime => {
  const d = new Date(datetime);
  return `${d.toDateString()} ${d.toLocaleTimeString()}`;
}

const History = ({ data, history, theme }) => (
  <ul className='pipeline-history'>
    { history.map(d =>
      <li key={d.created_ts}>
        <RadioButton
          checked={'data.created_ts' === d.created_ts}
          label={(
            <span className='pipeline-history__label'>
              <b>{ d.message }</b> <span>{ time(+d.created_ts) }</span>
            </span>
          )}
          name={`history-${d.created_ts}`}
          onChange={console.log}
          value={d.created_ts}
          theme={theme} />
      </li>
    ) }
  </ul>
)

export default History;
