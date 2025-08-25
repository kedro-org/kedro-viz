import React from 'react';
import Sidebar from '../sidebar';
import KedroRunManager from '../runner/runner-manager';

// Simple wrapper for the Runner page that brings in the shared Sidebar
const RunnerWrapper = () => {
  return (
    <>
      <Sidebar disableMinimap={true} disableFilterButton={true} />
      <KedroRunManager />
    </>
  );
};

export default RunnerWrapper;
