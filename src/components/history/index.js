import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import { changeActiveSnapshot, deleteSnapshot } from '../../actions';
import { getActivePipelineData, getPipelineData } from '../../selectors';
import deleteIcon from './delete.svg';
import './history.scss';
import formatTime from '../../utils/format-time';
import { Scrollbars } from 'react-custom-scrollbars';

const History = ({
  activePipelineData,
  allowHistoryDeletion,
  onChangeActiveSnapshot,
  onDeleteSnapshot,
  pipelineData,
  theme
}) => {
  /**
   * Check snapshot equality with active snapshot
   * @param {Object} snapshot A snapshot
   * @return {Boolean} True if snapshot IDs match
   */
  const isActive = snapshot => activePipelineData.id === snapshot.id;

  return (
    <Scrollbars autoHide hideTracksWhenNotNeeded>
      <ul className='pipeline-history'>
        { pipelineData.map(snapshot =>
          <li
            className={classnames(
              'pipeline-history__row',
              {
                'pipeline-history__row--active': isActive(snapshot)
              }
            )}
            key={snapshot.id}>
            <RadioButton
              checked={isActive(snapshot)}
              label={(
                <span className='pipeline-history__label'>
                  <b>{ snapshot.message }</b> <span>{ formatTime(+snapshot.timestamp) }</span>
                </span>
              )}
              name='history'
              onChange={() => onChangeActiveSnapshot(snapshot)}
              value={snapshot.id}
              theme={theme} />
            { allowHistoryDeletion && (
              <button
                className='pipeline-history__delete'
                title='Delete snapshot'
                aria-label='Delete snapshot'
                onClick={() => onDeleteSnapshot(snapshot)}>
                <img src={deleteIcon} width='24' height='24' alt='Delete icon' />
              </button>
            ) }
          </li>
        ) }
      </ul>
    </Scrollbars>
  );
};

const mapStateToProps = state => ({
  activePipelineData: getActivePipelineData(state),
  allowHistoryDeletion: state.allowHistoryDeletion,
  pipelineData: getPipelineData(state),
  theme: state.theme,
});

const mapDispatchToProps = dispatch => ({
  onChangeActiveSnapshot: snapshot => dispatch(
    changeActiveSnapshot(snapshot.id)
  ),
  onDeleteSnapshot: snapshot => dispatch(
    deleteSnapshot(snapshot.id)
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(History);
