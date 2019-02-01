import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import { changeActivePipeline, deleteSnapshot } from '../../actions';
import deleteIcon from './delete.svg';
import './history.scss';
import formatTime from '../../utils/format-time';
import { Scrollbars } from 'react-custom-scrollbars';

const History = ({
  activePipelineData,
  allowHistoryDeletion,
  onChangeActivePipeline,
  onDeleteSnapshot,
  pipelineData,
  theme
}) => (
  <Scrollbars autoHide hideTracksWhenNotNeeded>
    <ul className='pipeline-history'>
      { pipelineData.map(snapshot =>
        <li
          className={classnames(
            'pipeline-history__row',
            {
              'pipeline-history__row--active': activePipelineData.created_ts === snapshot.created_ts
            }
          )}
          key={snapshot.created_ts}>
          <RadioButton
            checked={activePipelineData.created_ts === snapshot.created_ts}
            label={(
              <span className='pipeline-history__label'>
                <b>{ snapshot.message }</b> <span>{ formatTime(+snapshot.created_ts) }</span>
              </span>
            )}
            name='history'
            onChange={onChangeActivePipeline}
            value={snapshot.created_ts}
            theme={theme} />
          { allowHistoryDeletion && (
            <button
              className='pipeline-history__delete'
              title='Delete snapshot'
              aria-label='Delete snapshot'
              onClick={onDeleteSnapshot(snapshot)}>
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
  theme: state.theme,
});

const mapDispatchToProps = dispatch => ({
  onChangeActivePipeline: snapshot => dispatch(
    changeActivePipeline(snapshot)
  ),
  onDeleteSnapshot: snapshot => () => dispatch(
    deleteSnapshot(snapshot.kernel_ai_schema_id)
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(History);
