import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { getRunCommand, getVisibleRunCommand } from '../../selectors/command';
import classnames from 'classnames';

import './command.scss';

const Command = ({ runCommand, theme, visible }) => {
  return (
    <div
      className={classnames('command-wrapper', {
        'command-wrapper--visible': !visible,
      })}
    >
      <p>Run command:</p>
      <p>{runCommand}</p>
    </div>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  runCommand: getRunCommand(state),
  theme: state.theme,
  visible: getVisibleRunCommand(state),
  ...ownProps,
});

export const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Command);
