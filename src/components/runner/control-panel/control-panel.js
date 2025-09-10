import { useRef, useCallback, useState } from 'react';
import ParameterDialog from '../parameter-dialog/ParameterDialog';

const ControlPanel = ({ commandBuilder, onStartRun }) => {
  const inputRef = useRef();
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);

  const onOpenParamsDialog = useCallback(() => {
    setIsParamsModalOpen(true);
  }, []);

  const onCloseParamsModal = useCallback(() => {
    setIsParamsModalOpen(false);
  }, []);

  const {
    commandString,
    hasParamChanges,
    activePipeline,
    selectedTags,
    kedroEnv,
    diffModel,
    paramsArgString,
  } = commandBuilder || {};

  const handleCopy = useCallback(async () => {
    try {
      const text = inputRef.current?.value || commandString;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
        document.execCommand('copy');
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }
    } catch {}
  }, [commandString]);

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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              className="control-row__input"
              ref={inputRef}
              defaultValue={commandString || 'kedro run'}
              title={commandString}
              style={{ flex: '1 1 auto', minWidth: 0 }}
            />
            <button
              className="btn"
              onClick={handleCopy}
              title="Copy full command"
              aria-label="Copy full command"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 8px',
              }}
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
            Pro tip: use <code>kedro run -n</code> to run a single node.
          </small>
        </div>
      </div>
      {renderParameterDialog()}
    </>
  );
};

export default ControlPanel;
