import React, { useState } from 'react';
import classnames from 'classnames';
import { updateContent } from './update-reminder-content';

import Button from '../ui/button';
import CommandCopier from '../ui/command-copier/command-copier';
import IconButton from '../ui/icon-button';
import CloseIcon from '../icons/close';

import './update-reminder.css';

const UpdateReminder = ({ dismissed, isOutdated, setDismiss, versions }) => {
  const [expand, setExpand] = useState(false);
  const { latest, installed } = versions;

  const command = 'pip install -U kedro-viz';

  if (expand) {
    return (
      <div className="update-reminder">
        <div
          className={classnames('update-reminder-expanded-header', {
            'update-reminder-expanded-header--up-to-date': !isOutdated,
          })}
        >
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
        <div
          className={classnames('update-reminder-expanded-detail', {
            'update-reminder-expanded-detail--up-to-date': !isOutdated,
          })}
        >
          {isOutdated ? (
            <>
              <h3>Kedro-Viz {latest} is here!</h3>
              <p>
                We’re excited to announce Kedro-Viz {latest} has been released.
                To update Kedro Viz, copy and paste the following update command
                into your terminal.{' '}
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
            </>
          ) : (
            <>
              <h3>You're up to date</h3>
              <p>Kedro-Viz {latest}</p>
            </>
          )}
        </div>
        <div
          className={classnames('update-reminder-content', {
            'update-reminder-content--up-to-date': !isOutdated,
          })}
        >
          <h3>{updateContent.headline}</h3>
          <p>{updateContent.date}</p>
          {updateContent.features.map((feature) => {
            return (
              <div
                className="update-reminder-content--feature"
                key={feature.title}
              >
                <h4>{feature.title}</h4>
                {feature.image.length > 0 && (
                  <img alt={feature.title} src={feature.image} />
                )}
                <p>{feature.copy}</p>
                {feature.buttonLink.length > 0 && (
                  <a href={feature.buttonLink} rel="noreferrer" target="_blank">
                    <Button size="small">{feature.buttonText}</Button>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isOutdated && dismissed) {
    return (
      <span
        className="update-reminder-version-tag update-reminder-version-tag--outdated"
        onClick={() => setExpand(true)}
      >
        <span></span>Kedro-Viz {installed}
      </span>
    );
  } else if (!isOutdated) {
    return (
      <span
        className="update-reminder-version-tag update-reminder-version-tag--up-to-date"
        onClick={() => setExpand(true)}
      >
        Kedro-Viz {installed}
      </span>
    );
  }

  if (isOutdated && !dismissed) {
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
