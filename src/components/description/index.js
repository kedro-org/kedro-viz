import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { getActivePipelineData } from '../../selectors';
import './description.css';
import formatTime from '../../utils/format-time';

const Description = ({
  message,
  showHistory,
  timestamp,
  visibleNav,
}) => showHistory ? (
  <div className={classnames('snapshot-description carbon', {
    'snapshot-description--menu-visible': visibleNav
  })}>
    <p>Uploaded on: <b>{ formatTime(+timestamp) }</b>
    </p>
    <p>Title: <b>{ message }</b></p>
  </div>
) : null;

const mapStateToProps = (state) => {
  const { timestamp, message } = getActivePipelineData(state);
  return {
    message,
    showHistory: message && state.showHistory,
    timestamp,
  };
};

export default connect(mapStateToProps)(Description);
