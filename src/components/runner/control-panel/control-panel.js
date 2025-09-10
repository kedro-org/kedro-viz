import React from 'react';
import ParameterDialog from '../parameter-dialog/ParameterDialog';
import { toYamlString } from '../utils/yamlUtils';

const ControlPanel = ({
  currentCommand,
  onStartRun,
  commandInputRef,
  onCopyCommand,
  hasParamChanges,
  activePipeline,
  selectedTags,
  onOpenParamsDialog,
  // Param dialog props
  isParamsModalOpen,
  onCloseParamsModal,
  diffModel,
  paramsDialogSelectedKey,
  onSelectParamKey,
  renderHighlightedYamlLines,
  paramsArgString,
  kedroEnv,
}) => {
  const selectedKey =
    paramsDialogSelectedKey || (diffModel && diffModel[0] && diffModel[0].key);

  return (
    <section className="runner-manager__control-panel">
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
              ref={commandInputRef}
              defaultValue="kedro run"
              title={currentCommand}
              style={{ flex: '1 1 auto', minWidth: 0 }}
            />
            <button
              className="btn"
              onClick={onCopyCommand}
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

      <ParameterDialog
        isOpen={!!isParamsModalOpen}
        onClose={onCloseParamsModal}
        diffModel={diffModel}
        paramsArgString={paramsArgString}
        selectedKey={paramsDialogSelectedKey}
        onSelectKey={onSelectParamKey}
        toYamlString={toYamlString}
        renderHighlightedYamlLines={renderHighlightedYamlLines}
      />
    </section>
  );
};

export default ControlPanel;
