import { useCallback, useState, useEffect } from 'react';
import './ControlPanel.scss';
import ParameterDialog from '../parameter-dialog/ParameterDialog';

const STORAGE_KEY = 'kedro-viz.runner.customCommand';

const ControlPanel = ({ commandBuilder, onStartRun, showToast }) => {
  const {
    commandString: baseCommand,
    hasParamChanges,
    activePipeline,
    selectedTags,
    kedroEnv,
    diffModel,
    paramsArgString,
  } = commandBuilder || {};

  const [draftCommand, setDraftCommand] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return stored;
      }
    } catch {}
    return baseCommand;
  });
  const [isDirtyCommand, setIsDirtyCommand] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== baseCommand) {
        return true;
      }
    } catch {}
    return false;
  });
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);

  const onOpenParamsDialog = useCallback(() => {
    setIsParamsModalOpen(true);
  }, []);

  const onCloseParamsModal = useCallback(() => {
    setIsParamsModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isDirtyCommand) {
      setDraftCommand(baseCommand);
    }
  }, [baseCommand, isDirtyCommand]);

  // Persist or clear the custom command
  useEffect(() => {
    try {
      if (isDirtyCommand) {
        localStorage.setItem(STORAGE_KEY, draftCommand);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [draftCommand, isDirtyCommand]);

  const handleReset = useCallback(() => {
    setDraftCommand(baseCommand);
    setIsDirtyCommand(false);
    if (showToast) {
      showToast('Command reset!');
    }
  }, [baseCommand, showToast]);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draftCommand);
      } else if (draftCommand) {
        draftCommand.focus();
        draftCommand.select();
        document.execCommand('copy');
        draftCommand.setSelectionRange(
          draftCommand.value.length,
          draftCommand.value.length
        );
      }
    } finally {
      showToast && showToast('Command copied to clipboard!');
    }
  }, [draftCommand, showToast]);

  function renderParameterDialog() {
    if (!isParamsModalOpen) {
      return null;
    }
    return (
      <ParameterDialog
        onClose={onCloseParamsModal}
        diffModel={diffModel}
        paramsArgString={paramsArgString}
      />
    );
  }

  return (
    <>
      <div className="control-panel__header">
        <h3 className="section-title">Run command</h3>
        <button className="btn btn--primary" onClick={onStartRun}>
          Start run
        </button>
      </div>
      <div className="runner-manager__control-body">
        <div className="control-row">
          <label className="control-row__label">Command</label>
          <div className="control-panel__command-controls">
            <input
              className="control-row__input control-panel__command-input"
              type="text"
              value={draftCommand}
              title={draftCommand}
              onChange={(e) => {
                setDraftCommand(e.target.value);
                setIsDirtyCommand(e.target.value !== baseCommand);
              }}
            />
            <button
              className="btn control-panel__small-btn"
              onClick={handleReset}
              title="Reset command"
              aria-label="Reset command"
            >
              Reset
            </button>
            <button
              className="btn control-panel__small-btn"
              onClick={handleCopy}
              title="Copy full command"
              aria-label="Copy full command"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="control-row">
          <ul className="arglist" aria-label="Run arguments overview">
            {kedroEnv && kedroEnv !== 'local' && (
              <li className="arglist__item">
                <span className="arglist__label">Environment</span>
                <span className="arglist__flag">(-e)</span>
                <span className="arglist__sep">:</span>
                <span className="arglist__value">{kedroEnv}</span>
              </li>
            )}
            <li className="arglist__item">
              <span className="arglist__label">Pipeline</span>
              <span className="arglist__flag">(-p)</span>
              <span className="arglist__sep">:</span>
              <span className="arglist__value">{activePipeline}</span>
            </li>
            {selectedTags && selectedTags.length > 0 && (
              <li className="arglist__item">
                <span className="arglist__label">Tags</span>
                <span className="arglist__flag">(-t)</span>
                <span className="arglist__sep">:</span>
                <span className="arglist__value">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="chip" title={tag}>
                      {tag}
                    </span>
                  ))}
                </span>
              </li>
            )}
            {hasParamChanges && (
              <li className="arglist__item">
                <span className="arglist__label">Parameters</span>
                <span className="arglist__flag">(--params)</span>
                <span className="arglist__sep">:</span>
                <span className="arglist__value">
                  <button
                    type="button"
                    className="control-link"
                    onClick={onOpenParamsDialog}
                  >
                    View changes
                  </button>
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="runner-manager__control-footer">
        <div className="runner-manager__actions" />
        <div className="runner-manager__hints">
          <small>
            Pro tip: Watch your parameters closely to avoid unexpected behavior.
          </small>
        </div>
      </div>
      {renderParameterDialog()}
    </>
  );
};

export default ControlPanel;
