import React, { useState } from 'react';
import CommandCopier from '../ui/command-copier/command-copier';
import IconButton from '../ui/icon-button';
import CloseIcon from '../icons/close';

import './update-reminder.css';

const UpdateReminder = ({ versions, setDismiss }) => {
  const [expand, setExpand] = useState(false);
  const { latest } = versions;

  const command = 'pip install -U kedro-viz && kedro viz';

  if (expand) {
    return (
      <>
        <div className="update-reminder-expanded-header">
          <button className="kedro" onClick={() => setExpand(false)}>
            <p>Kedro-Viz {latest} is here! </p>
          </button>

          <div className="close-button-container">
            <IconButton
              container={React.Fragment}
              ariaLabel="Close Upgrade Reminder Panel"
              className="close-button"
              icon={CloseIcon}
              onClick={() => setDismiss(true)}
            />
          </div>
        </div>
        <div className="update-reminder-expanded-detail">
          <p>
            We're excited to announce that Kedro-Viz {latest} has been released.{' '}
            To update Kedro-Viz, copy and paste the following update command
            into your terminal.
          </p>

          <p className="subtext">Update command</p>
          <div className="command-copier">
            <CommandCopier command={command} />
          </div>

          <p className="subtext">
            Refer to the release page for the set of changes introduced. <br />
            <a
              href="https://github.com/kedro-org/kedro-viz/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              View release notes
            </a>
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="update-reminder-unexpanded">
      <button className="kedro" onClick={() => setExpand(true)}>
        <p>Kedro-Viz {latest} is here </p>
      </button>
      <button className="kedro" onClick={() => setDismiss(true)}>
        Dismiss
      </button>
    </div>
  );
};

export default UpdateReminder;
