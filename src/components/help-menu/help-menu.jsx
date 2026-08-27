import React, { useEffect, useState } from 'react';

import DocsIcon from '../icons/docs';
import HelpIcon from '../icons/help';
import IconButton from '../ui/icon-button';
import IdeaIcon from '../icons/idea';
import ReportIcon from '../icons/report';
import SlackIcon from '../icons/slack';
import {
  KEDRO_DOCS_URL,
  KEDRO_SLACK_URL,
  KEDRO_VIZ_REPORT_PROBLEM_URL,
  KEDRO_VIZ_SHARE_IDEA_URL,
} from '../../config';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';
import { useOutsideClick } from '../../utils/hooks';

import './help-menu.scss';

const helpMenuItems = [
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
    href: KEDRO_DOCS_URL,
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

const menuId = 'help-menu';

/**
 * Global toolbar button which reveals a list of Kedro-Viz support channels
 */
export const HelpMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useOutsideClick(() => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      // Closing unmounts whichever link has focus, so hand it back to the
      // button rather than letting it fall through to the document body
      const hadFocus = containerRef.current.contains(document.activeElement);
      setIsOpen(false);
      if (hadFocus) {
        containerRef.current.querySelector('button').focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isOpen]);

  return (
    // IconButton renders this wrapper itself, but it cannot forward a ref to
    // it, and both the outside click and the focus restoration need one
    <li className="pipeline-icon--container" ref={containerRef}>
      <IconButton
        active={isOpen}
        ariaControls={isOpen ? menuId : undefined}
        ariaExpanded={isOpen}
        ariaLabel="Help and resources"
        className="pipeline-menu-button--help pipeline-menu-button--large"
        container={React.Fragment}
        dataTest={getDataTestAttribute('global-toolbar', 'help-btn')}
        icon={HelpIcon}
        // The tooltip would otherwise sit on top of the open menu
        labelText={isOpen ? null : 'Help and resources'}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="help-menu" id={menuId}>
          {helpMenuItems.map(({ href, icon: Icon, id, label }) => (
            <a
              className="help-menu__item"
              data-test={getDataTestAttribute('help-menu', id)}
              href={href}
              key={id}
              onClick={() => setIsOpen(false)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon className="pipeline-icon help-menu__icon" />
              {label}
            </a>
          ))}
        </div>
      )}
    </li>
  );
};

export default HelpMenu;
