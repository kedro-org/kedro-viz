import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { RadioButton } from '@quantumblack/carbon-ui-components';
import { changeActiveSnapshot, deleteSnapshot } from '../../actions';
import { getSnapshotHistory } from '../../selectors';
import deleteIcon from './delete.svg';
import './history.css';
import formatTime from '../../utils/format-time';
import { Scrollbars } from 'react-custom-scrollbars';

/**
 * Display a scrollable list of snapshots
 * @param {string} activeSnapshot UID for the current snapshot
 * @param {Boolean} allowHistoryDeletion If true, display delete buttons
 * @param {Function} onChangeActiveSnapshot Handle switching the activeSnapshot
 * @param {Function} onDeleteSnapshot Handle deleting a snapshot from the list
 * @param {Array} snapshots List of snapshots
 * @param {string} theme CarbonUI light/dark theme
 */
const History = ({
  activeSnapshot,
  allowHistoryDeletion,
  onChangeActiveSnapshot,
  onDeleteSnapshot,
  snapshots,
  theme
}) => {
  /**
   * Check snapshot equality with active snapshot
   * @param {Object} snapshot A snapshot
   * @return {Boolean} True if snapshot IDs match
   */
  const isActive = snapshot => activeSnapshot === snapshot.id;

  return (
    <Scrollbars autoHide hideTracksWhenNotNeeded>
      <ul className='pipeline-history'>
        { snapshots.map(snapshot =>
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
  activeSnapshot: state.activeSnapshot,
  allowHistoryDeletion: state.allowHistoryDeletion,
  snapshots: getSnapshotHistory(state),
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
