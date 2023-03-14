import React, { useState } from 'react';
import CommandCopier from '../ui/command-copier/command-copier';
import { updateContent } from './update-reminder-content';

import IconButton from '../ui/icon-button';
import CloseIcon from '../icons/close';

import './update-reminder.css';

const UpdateReminder = ({ dismissed, isOutdated, setDismiss, versions }) => {
  const [expand, setExpand] = useState(false);
  const { latest, installed } = versions;

  const command = 'pip install -U kedro-viz && kedro-viz';

  if (expand) {
    return (
      <div className="update-reminder">
        <div className="update-reminder-expanded-header">
          <div className="close-button-container">
            <IconButton
              ariaLabel="Close Upgrade Reminder Panel"
              className="close-button"
              container={React.Fragment}
              icon={CloseIcon}
              onClick={() => setExpand(false)}
            />
          </div>
        </div>
        <div className="update-reminder-expanded-detail">
          <h3>Kedro-Viz {latest} is here!</h3>
          <p>
            We’re excited to announce KedroViz {latest} has been released. To
            update Kedro Viz, copy and paste the following update command into
            your terminal.{' '}
            <a
              href="https://github.com/kedro-org/kedro-viz/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              View full changelog.
            </a>
          </p>

          <p className="subtext">Update command</p>
          <div className="command-copier">
            <CommandCopier command={command} isCommand />
          </div>
        </div>
        <div className="update-reminder-content">
          <h3>{updateContent.headline}</h3>
          <p>{updateContent.date}</p>
          {updateContent.sections.map((section) => {
            return (
              <div
                className="update-reminder-content--section"
                key={section.sectionTitle}
              >
                <h4>{section.sectionTitle}</h4>
                <p>{section.sectionCopy}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (dismissed) {
    if (isOutdated) {
      return (
        <span
          className="update-reminder-version-tag update-reminder-version-tag--outdated"
          onClick={() => setExpand(true)}
        >
          <span></span>Kedro-Viz {installed}
        </span>
      );
    } else {
      return (
        <span className="update-reminder-version-tag update-reminder-version-tag--up-to-date">
          Kedro-Viz {installed}
        </span>
      );
    }
  } else {
    return (
      <div className="update-reminder-unexpanded">
        <p>Kedro-Viz {latest} is here! </p>
        <div className="buttons-container">
          <button className="kedro" onClick={() => setExpand(true)}>
            Expand
          </button>
          <button className="kedro" onClick={() => setDismiss(true)}>
            Dismiss
          </button>
        </div>
      </div>
    );
  }
};

export default UpdateReminder;
