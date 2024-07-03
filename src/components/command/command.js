import React, { useState } from 'react';
import { connect } from 'react-redux';
import { getRunCommand, getVisibleRunCommand } from '../../selectors/command';
import Button from '../ui/button';
import Tooltip from '../ui/tooltip';
import classnames from 'classnames';

import './command.scss';

const Command = ({ runCommand, theme, visible, showSidebar }) => {
  const [showCopied, setShowCopied] = useState(false);

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(runCommand);
    setShowCopied(true);

    setTimeout(() => setShowCopied(false), 1500);
  };

  return (
    <div
      className={classnames('command-wrapper', {
        'command-wrapper--visible': !visible,
        'command-wrapper--with-sidebar': showSidebar,
      })}
    >
      <h3 className="command-title">Run command:</h3>
      <div className="command-copier-wrapper">
        <div className="command-line">{runCommand}</div>
        {/* {window.navigator.clipboard && ( */}
        <Button
          ariaLabel="Copy run command to clipboard."
          dataTest={'run-command-copy-button'}
          dataHeapEvent={`clicked.run_command`}
          onClick={onCopyClick}
          size="small"
        >
          Copy
        </Button>
        <Tooltip
          text="Copied!"
          visible={showCopied}
          noDelay
          centerArrow
          arrowSize="small"
        />
        {/* )} */}
      </div>
    </div>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  runCommand: getRunCommand(state),
  theme: state.theme,
  visible: getVisibleRunCommand(state),
  showSidebar: state.visible.sidebar,
  ...ownProps,
});

export const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Command);
