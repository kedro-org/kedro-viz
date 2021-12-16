import React from 'react';
import PrimaryToolbar from '../../primary-toolbar';
import IconButton from '../../icon-button';
import ShowChangesIcon from '../../icons/show-changes';

export const ExperimentPrimaryToolbar = ({
  sidebarVisible,
  setSidebarVisible,
  enableShowChanges,
  setEnableShowChanges,
  enableComparisonView,
  showChangesIconDisabled,
}) => {
  return (
    <PrimaryToolbar
      visible={{ sidebar: sidebarVisible }}
      onToggleSidebar={setSidebarVisible}
    >
      <IconButton
        ariaLive="polite"
        className={'pipeline-menu-button--labels'}
        onClick={() => setEnableShowChanges(!enableShowChanges)}
        icon={ShowChangesIcon}
        labelText={
          !showChangesIconDisabled
            ? `${enableShowChanges ? 'Disable' : 'Enable'} show changes`
            : null
        }
        visible={enableComparisonView}
        disabled={showChangesIconDisabled}
      />
    </PrimaryToolbar>
  );
};

export default ExperimentPrimaryToolbar;
