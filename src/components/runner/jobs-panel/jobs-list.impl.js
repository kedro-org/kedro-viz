import React from 'react';

const JobsList = ({
  jobs,
  isLogsModalOpen,
  logsModalJobId,
  onTerminateJob,
  onOpenLogsModal,
  onCloseLogsModal,
  expandedLogs,
  onSetLogExpanded,
  jobsPanelBodyRef,
}) => {
  return (
    <section className="runner-manager__jobs-panel" ref={jobsPanelBodyRef}>
      {/* Body is still rendered by parent to preserve exact markup and behavior */}
    </section>
  );
};

export default JobsList;
