import React, { useEffect, useRef, useState } from 'react';

import DocsIcon from '../icons/docs';
import HelpIcon from '../icons/help';
import IconButton from '../ui/icon-button';
import IdeaIcon from '../icons/idea';
import ReportIcon from '../icons/report';
import SlackIcon from '../icons/slack';
import {
  KEDRO_SLACK_URL,
  KEDRO_VIZ_DOCS_URL,
  KEDRO_VIZ_REPORT_PROBLEM_URL,
  KEDRO_VIZ_SHARE_IDEA_URL,
} from '../../config';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

import './help-menu.scss';

export const helpMenuItems = [
  {
    href: KEDRO_VIZ_REPORT_PROBLEM_URL,
    icon: ReportIcon,
    id: 'report-problem',
    label: 'Report problem',
  },
  {
    href: KEDRO_VIZ_SHARE_IDEA_URL,
    icon: IdeaIcon,
    id: 'share-idea',
    label: 'Share idea',
  },
  {
    href: KEDRO_VIZ_DOCS_URL,
    icon: DocsIcon,
    id: 'kedro-docs',
    label: 'Kedro Docs',
  },
  {
    href: KEDRO_SLACK_URL,
    icon: SlackIcon,
    id: 'kedro-slack',
    label: 'Kedro Slack',
  },
];

/**
 * Global toolbar button which opens a menu of Kedro-Viz support channels
 */
export const HelpMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <li className="pipeline-icon--container" ref={containerRef}>
      <IconButton
        active={isOpen}
        ariaLabel={`${isOpen ? 'Close' : 'Open'} help and resources`}
        ariaLive="polite"
        className="pipeline-menu-button--help pipeline-menu-button--large"
        container={React.Fragment}
        dataTest={getDataTestAttribute('global-toolbar', 'help-btn')}
        icon={HelpIcon}
        // The tooltip would otherwise sit on top of the open menu
        labelText={isOpen ? null : 'Help and resources'}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div aria-label="Help and resources" className="help-menu" role="menu">
          {helpMenuItems.map(({ href, icon: Icon, id, label }) => (
            <a
              className="help-menu__item"
              data-test={getDataTestAttribute('help-menu', id)}
              href={href}
              key={id}
              onClick={() => setIsOpen(false)}
              rel="noopener noreferrer"
              role="menuitem"
              target="_blank"
            >
              <Icon className="help-menu__icon" />
              <span className="help-menu__label">{label}</span>
            </a>
          ))}
        </div>
      )}
    </li>
  );
};

export default HelpMenu;
