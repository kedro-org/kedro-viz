import React from 'react';
import { Icon, RadioButton } from '@quantumblack/carbon-ui-components';
import './history.css';

const time = datetime => {
  const d = new Date(datetime);
  return `${d.toDateString()} ${d.toLocaleTimeString()}`;
}

const History = ({
  activePipelineData,
  pipelineData,
  onChangeActivePipeline,
  onDeleteSnapshot,
  theme
}) => (
  <ul className='pipeline-history'>
    { pipelineData.map(d =>
      <li className='pipeline-history__row' key={d.created_ts}>
        <RadioButton
          checked={activePipelineData.created_ts === d.created_ts}
          label={(
            <span className='pipeline-history__label'>
              <b>{ d.message }</b> <span>{ time(+d.created_ts) }</span>
            </span>
          )}
          name='history'
          onChange={() => onChangeActivePipeline(d)}
          value={d.created_ts}
          theme={theme} />
        <button
          className='pipeline-history__delete'
          title='Delete snapshot'
          aria-label='Delete snapshot'
          onClick={() => onDeleteSnapshot(d.kernel_ai_schema_id)}>
          <Icon type="close" title="Close" theme={theme} />
        </button>
      </li>
    ) }
  </ul>
)

export default History;
