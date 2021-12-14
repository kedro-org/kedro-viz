import React from 'react';
import IconButton from '../../icon-button';
import PencilIcon from '../../icons/pencil';

import PrimaryToolbar from '../../primary-toolbar';

export const ExperimentPrimaryToolbar = ({
  enableComparisonView,
  sidebarVisible,
  setSidebarVisible,
  showRunDetailsModal,
}) => {
  return (
    <PrimaryToolbar
      visible={{ sidebar: sidebarVisible }}
      onToggleSidebar={setSidebarVisible}
    >
      {enableComparisonView ? null : (
        <IconButton
          ariaLive="Edit run details"
          className={'pipeline-menu-button--labels'}
          icon={PencilIcon}
          labelText={`Edit details`}
          onClick={() => showRunDetailsModal(true)}
        />
      )}
    </PrimaryToolbar>
  );
};

export default ExperimentPrimaryToolbar;
