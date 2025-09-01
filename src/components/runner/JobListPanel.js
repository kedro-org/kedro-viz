import React, { useRef } from 'react';

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
  onOpenClearJobsConfirm,
  onTerminateJob,
  setLogExpanded,
  logRefs = {},
}) {
  const jobsPanelBodyRef = useRef(null);
  return (
    <>
      <div className="jobs-panel__header">
        <h3 className="section-title">Jobs</h3>
        <button
          className="btn btn--secondary"
          onClick={onOpenClearJobsConfirm}
          disabled={jobs.length === 0}
        >
          Clear jobs
        </button>
      </div>
      <div className="jobs-panel__body" ref={jobsPanelBodyRef}>
        <div className="jobs-list">
          {jobs.length === 0 && (
            <div className="job-card">
              <div className="job-card__meta">
                <div className="job-card__id">No jobs</div>
              </div>
              <div className="job-card__body">
                <div className="job-card__stdout">
                  <pre>Click "Start run" to create a job.</pre>
                </div>
              </div>
            </div>
          )}
          {jobs.map((job) => {
            const isExpanded = expandedLogs[job.jobId];
            const isTerminal = ['finished', 'error', 'terminated'].includes(
              job.status
            );
            const expanded =
              typeof isExpanded === 'boolean' ? isExpanded : !isTerminal;
            const stdoutStyle = {
              display: expanded ? 'block' : 'none',
              maxHeight: expanded ? '70vh' : '0px',
              overflow: 'auto',
            };
            const bodyHeight = jobsPanelBodyRef.current?.clientHeight || 0;
            const cardMax = bodyHeight > 0 ? bodyHeight - 24 : 0;
            const status = job.status;
            const statusClass =
              status === 'error' || status === 'terminated'
                ? 'job-card__status--error'
                : status === 'finished'
                ? 'job-card__status--finished'
                : 'job-card__status--pending';
            const canTerminate = !['finished', 'error', 'terminated'].includes(
              status
            );
            const cardClass = `job-card ${
              canTerminate ? 'job-card--can-terminate' : ''
            }`;
            return (
              <article
                key={job.jobId}
                className={cardClass}
                style={cardMax ? { maxHeight: `${cardMax}px` } : null}
              >
                <div className="job-card__meta">
                  <div className={`job-card__status ${statusClass}`}>
                    {status}
                  </div>
                  <div className="job-card__time">
                    started {new Date(job.startedAt).toLocaleTimeString()}
                  </div>
                  <div
                    className="job-card__actions"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    {canTerminate && (
                      <button
                        className="btn btn--danger"
                        onClick={() => onTerminateJob(job.jobId)}
                        title="Terminate job"
                      >
                        Terminate
                      </button>
                    )}
                    <button
                      className="btn"
                      onClick={() => onOpenLogsModal(job.jobId)}
                    >
                      View full logs
                    </button>
                    <button
                      className="btn"
                      onClick={() => onOpenClearJobConfirm(job.jobId)}
                      title="Remove this job from the list"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="job-card__body">
                  <div className="job-card__controls job-card__controls--top">
                    <div className="job-card__toggle pipeline-toggle">
                      <input
                        id={`pipeline-toggle-input-${job.jobId}`}
                        className="pipeline-toggle-input"
                        type="checkbox"
                        checked={expanded}
                        onChange={(e) =>
                          setLogExpanded
                            ? setLogExpanded(job.jobId, e.target.checked)
                            : onToggleLogExpanded(job.jobId)
                        }
                      />
                      <label
                        className={`pipeline-toggle-label ${
                          expanded ? 'pipeline-toggle-label--checked' : ''
                        }`}
                        htmlFor={`pipeline-toggle-input-${job.jobId}`}
                      >
                        {expanded ? 'Collapse logs' : 'Expand logs'}
                      </label>
                    </div>
                  </div>
                  <div className="job-card__details">
                    <div className="job-card__row">
                      <strong>Job:</strong> {job.jobId}
                    </div>
                    <div className="job-card__row">
                      <strong>Command:</strong> {job.command}
                    </div>
                    <div className="job-card__row">
                      <strong>Duration:</strong>{' '}
                      {typeof job.duration !== 'undefined' ? job.duration : '—'}
                      {job.endTime && (
                        <>
                          {' '}
                          · ended {new Date(job.endTime).toLocaleTimeString()}
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="job-card__stdout"
                    style={stdoutStyle}
                    ref={(el) => {
                      if (logRefs) {
                        logRefs[job.jobId] = el;
                      }
                    }}
                  >
                    <pre>{job.logs}</pre>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default JobListPanel;
