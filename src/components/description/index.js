import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import {
  getActiveSnapshotMessage,
  getActiveSnapshotTimestamp
} from '../../selectors';
import './description.css';
import { formatTime } from '../../utils';

/**
 * Title/description for the current active snapshot.
 * Should not be displayed if history is hidden or message is null.
 * @param {string} message Text to display.
 * @param {Boolean} showDescription Whether to render at all.
 * @param {number} timestamp Numeric upload datetime for the current snapshot.
 * @param {Boolean} visibleNav Whether the sidebar nav is visible. Affects styling.
 */
export const Description = ({
  message,
  showDescription,
  timestamp,
  visibleNav
}) =>
  showDescription ? (
    <div
      className={classnames('snapshot-description kedro', {
        'snapshot-description--menu-visible': visibleNav
      })}>
      <p>
        Uploaded on: <b>{formatTime(timestamp)}</b>
      </p>
      <p>
        Title: <b>{message}</b>
      </p>
    </div>
  ) : null;

export const mapStateToProps = state => {
  const message = getActiveSnapshotMessage(state);
  return {
    message,
    showDescription: message && state.showHistory,
    timestamp: getActiveSnapshotTimestamp(state)
  };
};

export default connect(mapStateToProps)(Description);
