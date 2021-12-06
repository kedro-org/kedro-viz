import React from 'react';
import PrimaryToolbar from '../../primary-toolbar';

export const ExperimentPrimaryToolbar = ({
  sidebarVisible,
  setSidebarVisible,
}) => {
  return (
    <PrimaryToolbar
      visible={{ sidebar: sidebarVisible }}
      onToggleSidebar={setSidebarVisible}
    />
  );
};

export default ExperimentPrimaryToolbar;
