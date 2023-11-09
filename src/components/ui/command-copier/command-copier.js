import React, { useState } from 'react';
import MetaDataValue from '../../metadata/metadata-value';
import IconButton from '../../ui/icon-button';
import Tooltip from '../tooltip';
import CopyIcon from '../../icons/copy';
import './command-copier.scss';

const CommandCopier = ({ command, isCommand }) => {
  const [showCopied, setShowCopied] = useState(false);

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(command);
    setShowCopied(true);

    setTimeout(() => setShowCopied(false), 1500);
  };

  return (
    <div className="container">
      <MetaDataValue
        container={'code'}
        className="command-value"
        value={command}
      />
      {window.navigator.clipboard && isCommand && (
        <ul className="toolbox">
          <IconButton
            ariaLabel="Copy run command to clipboard."
            className="copy-button"
            dataHeapEvent={`clicked.run_command`}
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
