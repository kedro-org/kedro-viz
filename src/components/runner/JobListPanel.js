import React from 'react';

/**
 * JobListPanel - Presentational component for displaying the list of jobs and their statuses.
 * Props:
 *   jobs: Array of job objects
 *   expandedLogs: Object mapping jobId to expanded state
 *   onToggleLogExpanded: Function(jobId)
 *   onOpenLogsModal: Function(jobId)
 *   onOpenClearJobConfirm: Function(jobId)
 *   onTerminateJob: Function(jobId)
 *   logRefs: Object mapping jobId to ref
 */
function JobListPanel({
  jobs = [],
  expandedLogs = {},
  onToggleLogExpanded,
  onOpenLogsModal,
  onOpenClearJobConfirm,
  onTerminateJob,
  logRefs = {},
}) {
  if (!jobs.length) {
    return <div className="jobs-panel__empty">No jobs yet.</div>;
  }
  return (
    <div className="jobs-panel__body">
      {jobs.map((job) => (
        <div
          key={job.jobId}
          className={`jobs-panel__job jobs-panel__job--${
            job.status || 'unknown'
          }`}
        >
          <div className="jobs-panel__header">
            <span className="jobs-panel__id">{job.jobId}</span>
            <span className="jobs-panel__status">{job.status}</span>
            <button onClick={() => onToggleLogExpanded(job.jobId)}>
              {expandedLogs[job.jobId] !== false ? 'Collapse' : 'Expand'}
            </button>
            <button onClick={() => onOpenLogsModal(job.jobId)}>
              View Logs
            </button>
            <button onClick={() => onOpenClearJobConfirm(job.jobId)}>
              Clear
            </button>
            <button onClick={() => onTerminateJob(job.jobId)}>Terminate</button>
          </div>
          {expandedLogs[job.jobId] !== false && (
            <pre
              ref={(el) => {
                if (logRefs) {
                  logRefs[job.jobId] = el;
                }
              }}
              className="jobs-panel__logs"
            >
              {job.logs || ''}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

export default JobListPanel;
