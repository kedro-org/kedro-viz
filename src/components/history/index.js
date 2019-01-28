import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import { changeActivePipeline } from '../../actions';
import deleteIcon from './delete.svg';
import './history.css';
import formatTime from '../../utils/format-time';
import { Scrollbars } from 'react-custom-scrollbars';

const History = ({
  activePipelineData,
  allowHistoryDeletion,
  dispatch,
  pipelineData,
  onDeleteSnapshot,
  theme
}) => (
  <Scrollbars autoHide hideTracksWhenNotNeeded>
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
            onChange={() => dispatch(changeActivePipeline(d))}
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
  </Scrollbars>
)

const mapStateToProps = state => ({
  activePipelineData: state.activePipelineData,
  allowHistoryDeletion: state.allowHistoryDeletion,
  pipelineData: state.pipelineData,
  onDeleteSnapshot: state.onDeleteSnapshot,
  theme: state.theme,
});

export default connect(mapStateToProps)(History);
