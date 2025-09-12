import { useRef, useState, useCallback } from 'react';
import IconButton from '../../ui/icon-button';
import CloseIcon from '../../icons/close';
import './JobListPanel.scss';

function renderConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }
  return (
    <div
      className="runner-logs-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Clear job confirmation"
    >
      <div className="runner-logs-modal__content">
        <div className="runner-logs-modal__header">
          <h3 className="runner-logs-modal__title">{title}</h3>
          <IconButton
            className="runner-logs-modal__close runner-logs-modal__close--confirm"
            container="div"
            aria-label="Close"
            onClick={onCancel}
            icon={CloseIcon}
          />
        </div>
        <div className="runner-logs-modal__body">
          <p>{message}</p>
        </div>
        <div className="runner-logs-modal__footer">
          <button className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderLogsModal({
  isLogsModalOpen = false,
  title = 'Job logs',
  logMessage,
  confirmLabel = 'Close',
  onClose,
}) {
  if (!isLogsModalOpen) {
    return null;
  }
  return (
    <div
      className="runner-logs-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Job logs dialog"
    >
      <div className="runner-logs-modal__content">
        <div className="runner-logs-modal__header">
          <h3 className="runner-logs-modal__title">{title}</h3>
          <IconButton
            className="runner-logs-modal__close"
            aria-label="Close"
            onClick={onClose}
            icon={CloseIcon}
          />
        </div>
        <div className="runner-logs-modal__body">
          <pre>{logMessage || 'No logs available.'}</pre>
        </div>
        <div className="runner-logs-modal__footer">
          <button className="btn" onClick={onClose}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderJobMetadata({
  job,
  isExpanded,
  logRefs,
  jobsPanelBodyRef,
  onTerminateJob,
  toggleLogExpanded,
  openLogsModal,
  openClearJobConfirm,
}) {
  const isTerminal = ['finished', 'error', 'terminated'].includes(job.status);
  const expanded = typeof isExpanded === 'boolean' ? isExpanded : !isTerminal;
  // stdout expanded/collapsed handled via CSS classes now
  const bodyHeight = jobsPanelBodyRef.current?.clientHeight || 0;
  const cardMax = bodyHeight > 0 ? bodyHeight - 24 : 0;
  const status = job.status;
  const statusClass =
    status === 'error' || status === 'terminated'
      ? 'job-card__status--error'
      : status === 'finished'
      ? 'job-card__status--finished'
      : 'job-card__status--pending';
  const canTerminate = !['finished', 'error', 'terminated'].includes(status);
  const cardClass = `job-card ${canTerminate ? 'job-card--can-terminate' : ''}`;
  return (
    <article
      key={job.jobId}
      className={cardClass}
      style={cardMax ? { maxHeight: `${cardMax}px` } : null}
    >
      <div className="job-card__meta">
        <div className={`job-card__status ${statusClass}`}>{status}</div>
        <div className="job-card__time">
          started {new Date(job.startedAt).toLocaleTimeString()}
        </div>
        <div className="job-card__actions">
          {canTerminate && (
            <button
              className="btn btn--danger"
              onClick={() => onTerminateJob(job.jobId)}
              title="Terminate job"
            >
              Terminate
            </button>
          )}
          <button className="btn" onClick={() => openLogsModal(job.jobId)}>
            View full logs
          </button>
          <button
            className="btn"
            onClick={() => openClearJobConfirm(job.jobId)}
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
              onChange={(e) => toggleLogExpanded(job.jobId)}
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
              <> · ended {new Date(job.endTime).toLocaleTimeString()}</>
            )}
          </div>
        </div>
        <div
          className={`job-card__stdout ${
            expanded ? 'job-card__stdout--expanded' : ''
          }`}
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
}

function JobListPanel({
  jobs = [],
  logRefs = {},
  onRemoveJob,
  onTerminateJob,
}) {
  const jobsPanelBodyRef = useRef(null);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isClearAllJobsModalOpen, setIsClearAllJobsModalOpen] = useState(false);
  const [isClearJobModalOpen, setIsClearJobModalOpen] = useState(false);
  const [clearJobModalJobId, setClearJobModalJobId] = useState(null);
  const [logsModalJobId, setLogsModalJobId] = useState(null);

  const toggleLogExpanded = useCallback((jobId) => {
    setExpandedLogs((prev) => {
      const next = { ...(prev || {}) };
      next[jobId] = !next[jobId];
      return next;
    });
  }, []);

  const openLogsModal = useCallback((jobId) => {
    setIsLogsModalOpen(true);
    setLogsModalJobId(jobId);
  }, []);

  const closeLogsModal = useCallback(() => {
    setIsLogsModalOpen(false);
    setLogsModalJobId(null);
  }, []);

  const openClearJobConfirm = useCallback((jobId) => {
    setIsClearJobModalOpen(true);
    setClearJobModalJobId(jobId);
  }, []);

  const closeClearJobConfirm = useCallback(() => {
    setIsClearJobModalOpen(false);
    setClearJobModalJobId(null);
  }, []);

  const openClearAllJobsConfirm = useCallback(() => {
    setIsClearAllJobsModalOpen(true);
  }, []);

  const closeClearAllJobsConfirm = useCallback(() => {
    setIsClearAllJobsModalOpen(false);
  }, []);

  const clearJob = useCallback(
    (jobId) => {
      onRemoveJob(jobId);

      // Remove jobID from expandedLogs state
      setExpandedLogs((prev) => {
        const next = { ...(prev || {}) };
        delete next[jobId];
        return next;
      });
    },
    [onRemoveJob]
  );

  const clearAllJobs = useCallback(() => {
    (jobs || []).forEach((j) => clearJob(j.jobId));
  }, [jobs, clearJob]);

  return (
    <>
      <div className="jobs-panel__header">
        <h3 className="section-title">Jobs</h3>
        <button
          className="btn btn--secondary"
          onClick={openClearAllJobsConfirm}
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
          {jobs.map((job) =>
            renderJobMetadata({
              job,
              isExpanded: expandedLogs[job.jobId],
              logRefs,
              jobsPanelBodyRef,
              onTerminateJob,
              toggleLogExpanded,
              openLogsModal,
              openClearJobConfirm,
            })
          )}
        </div>
        {renderConfirmationModal({
          isOpen: isClearAllJobsModalOpen,
          title: 'Clear all jobs',
          message:
            'This will remove all jobs from the list (running jobs will have polling stopped). Continue?',
          confirmLabel: 'Yes, clear all',
          cancelLabel: 'Cancel',
          onConfirm: () => {
            clearAllJobs();
            closeClearAllJobsConfirm();
          },
          onCancel: closeClearAllJobsConfirm,
        })}
        {renderConfirmationModal({
          isOpen: isClearJobModalOpen,
          title: 'Clear job',
          message:
            'Remove this job from the list? (If running, polling will stop.)',
          confirmLabel: 'Yes, clear job',
          cancelLabel: 'Cancel',
          onConfirm: () => {
            clearJob(clearJobModalJobId);
            closeClearJobConfirm();
          },
          onCancel: closeClearJobConfirm,
        })}
        {renderLogsModal({
          isLogsModalOpen,
          title: `Job logs - ${logsModalJobId || ''}`,
          logMessage:
            (jobs || []).find((j) => j.jobId === logsModalJobId)?.logs || '',
          onClose: closeLogsModal,
        })}
      </div>
    </>
  );
}

export default JobListPanel;
