import React, { useState } from 'react';
import classnames from 'classnames';
import IconButton from '../../ui/icon-button';
import Tooltip from '../tooltip';
import CopyIcon from '../../icons/copy';
import './command-copier.scss';

const CommandCopier = ({ command, classNames, isCommand, dataTest }) => {
  const [showCopied, setShowCopied] = useState(false);

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(command);
    setShowCopied(true);

    setTimeout(() => setShowCopied(false), 1500);
  };

  return (
    <div className="container">
      <code className={classnames('command-value', classNames)}>{command}</code>
      {window.navigator.clipboard && isCommand && (
        <ul className="toolbox">
          <IconButton
            ariaLabel="Copy run command to clipboard."
            className="copy-button"
            dataTest={dataTest}
            icon={CopyIcon}
            onClick={onCopyClick}
          />
          <Tooltip
            text="Copied!"
            visible={showCopied}
            noDelay
            centerArrow
            arrowSize="small"
          />
        </ul>
      )}
    </div>
  );
};

export default CommandCopier;
