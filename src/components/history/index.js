import React from 'react';
import classnames from 'classnames';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import deleteIcon from './delete.svg';
import './history.css';
import formatTime from '../../utils/format-time';

const History = ({
  activePipelineData,
  allowHistoryDeletion,
  pipelineData,
  onChangeActivePipeline,
  onDeleteSnapshot,
  theme
}) => (
  <ul className='pipeline-history'>
    { pipelineData.map(d =>
      <li
        className={classnames(
          'pipeline-history__row',
          {
            'pipeline-history__row--active': activePipelineData.created_ts === d.created_ts
          }
        )}
        key={d.created_ts}>
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
        { allowHistoryDeletion && (
          <button
            className='pipeline-history__delete'
            title='Delete snapshot'
            aria-label='Delete snapshot'
            onClick={() => onDeleteSnapshot(d.kernel_ai_schema_id)}>
            <img src={deleteIcon} width='24' height='24' alt='Delete icon' />
          </button>
        ) }
      </li>
    ) }
  </ul>
)

export default History;
