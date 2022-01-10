import React from 'react';
import IconButton from '../../icon-button';
import PencilIcon from '../../icons/pencil';
import PrimaryToolbar from '../../primary-toolbar';
import ShowChangesIcon from '../../icons/show-changes';

export const ExperimentPrimaryToolbar = ({
  enableComparisonView,
  enableShowChanges,
  setEnableShowChanges,
  setSidebarVisible,
  showChangesIconDisabled,
  showRunDetailsModal,
  sidebarVisible,
}) => {
  return (
    <PrimaryToolbar
      visible={{ sidebar: sidebarVisible }}
      onToggleSidebar={setSidebarVisible}
    >
      <IconButton
        ariaLive="Edit run details"
        className={'pipeline-menu-button--labels'}
        icon={PencilIcon}
        labelText={`Edit details`}
        onClick={() => showRunDetailsModal(true)}
        visible={!enableComparisonView}
      />
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
