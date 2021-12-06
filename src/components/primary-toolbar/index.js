import React from 'react';
import classnames from 'classnames';
import IconButton from '../icon-button';
import MenuIcon from '../icons/menu';

import './primary-toolbar.css';

/**
 * Toolbar to house buttons that controls display options for the main panel (flowchart, experiment details, etc)
 * @param {JSX} children The content to be rendered within the toolbar
 * @param {Function} onToggleSidebar Handle toggling of sidebar collapsable view
 * @param {Boolean} visible Handle display of tooltip text in relation to collapsable view
 */
export const PrimaryToolbar = ({
  children,
  onToggleSidebar,
  visible = { sidebar: true },
}) => (
  <>
    <ul className="pipeline-primary-toolbar kedro">
      <IconButton
        ariaLabel={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
        className={classnames(
          'pipeline-menu-button',
          'pipeline-menu-button--menu',
          {
            'pipeline-menu-button--inverse': !visible.sidebar,
          }
        )}
        onClick={() => onToggleSidebar(!visible.sidebar)}
        icon={MenuIcon}
        labelText={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
      />
      {children}
    </ul>
  </>
);

export default PrimaryToolbar;
