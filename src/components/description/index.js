import React from 'react';
import { connect } from 'react-redux';
import './description.scss';
import classnames from 'classnames';
import formatTime from '../../utils/format-time';

const Description = ({ timestamp, message, visibleNav }) => (
  <div className={classnames('snapshot-description carbon', {
    'snapshot-description--menu-visible': visibleNav
  })}>
    <p>Uploaded on: <b>{ formatTime(+timestamp) }</b>
    </p>
    <p>Title: <b>{ message }</b></p>
  </div>
);

const mapStateToProps = (state) => ({
  timestamp: state.activePipelineData.created_ts,
  message: state.activePipelineData.message
});

export default connect(mapStateToProps)(Description);
