import React, { useState } from 'react';
import modifiers from '../../../utils/modifiers';
import MetaDataValue from '../../metadata/metadata-value';
import IconButton from '../../icon-button';
import CopyIcon from '../../icons/copy';
import './command-copier.css';

const CommandCopier = ({ runCommand }) => {
  const [showCopied, setShowCopied] = useState(false);

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(runCommand);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  return (
    <div className="container">
      <MetaDataValue
        container={'code'}
        className={modifiers('run-command-value', {
          visible: !showCopied,
        })}
        value={runCommand}
      />
      {window.navigator.clipboard && runCommand && (
        <>
          <span
            className={modifiers('copy-message', {
              visible: showCopied,
            })}
          >
            Copied to clipboard.
          </span>
          <ul className="toolbox">
            <IconButton
              ariaLabel="Copy run command to clipboard."
              className="copy-button"
              icon={CopyIcon}
              onClick={onCopyClick}
            />
          </ul>
        </>
      )}
    </div>
  );
};

export default CommandCopier;
