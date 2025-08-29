import React from 'react';

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
  paramItems,
  paramsDialogSelectedKey,
  onSelectParamKey,
  paramOriginals,
  getParamValue,
  getEditedParamValue,
  normalizeParamPrefix,
  collectParamDiffs,
  toYamlString,
  renderHighlightedYamlLines,
  quoteIfNeeded,
  paramsArgString,
  kedroEnv,
}) => {
  const selectedKey =
    paramsDialogSelectedKey ||
    (paramItems && paramItems[0] && paramItems[0].id);
  let dialogBody = null;
  if (paramItems && paramItems.length) {
    const selectedItem =
      paramItems.find((i) => i.id === selectedKey) || paramItems[0];
    const originals = paramOriginals || {};
    const orig = Object.prototype.hasOwnProperty.call(originals, selectedKey)
      ? originals[selectedKey]
      : getParamValue(selectedKey);
    const curr = getEditedParamValue(selectedKey);
    const prefixName = normalizeParamPrefix(
      (selectedItem && selectedItem.name) || selectedKey
    );
    const perPairs = collectParamDiffs(orig, curr, prefixName);
    const perParamArg = `--params ${quoteIfNeeded(perPairs.join(','))}`;
    const combinedParamsArg = `--params ${quoteIfNeeded(
      paramsArgString || ''
    )}`;
    // Shared style to safely wrap long --params strings without affecting copy
    const argCodeStyle = {
      fontFamily: 'monospace',
      fontSize: '12px',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      lineBreak: 'anywhere',
    };
    dialogBody = (
      <div>
        <div style={argCodeStyle}>
          <code>{combinedParamsArg}</code>
        </div>
        <div
          style={{
            marginTop: '10px',
            border: '1px solid var(--runner-border)',
            background: 'var(--runner-subpanel-bg)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderBottom: '1px solid var(--runner-border)',
              background: 'var(--runner-subpanel-header-bg)',
            }}
          >
            <div style={{ fontWeight: 700 }}>Selected parameter</div>
            <select
              id="param-changes-select"
              aria-label="Selected parameter"
              value={selectedKey}
              onChange={(e) => onSelectParamKey(e.target.value)}
              style={{ width: '100%' }}
            >
              {paramItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || item.id}
                </option>
              ))}
            </select>
          </div>
          <div style={{ padding: '12px' }}>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                marginBottom: '10px',
              }}
            >
              <code style={{ ...argCodeStyle, marginBottom: '10px' }}>
                {perParamArg}
              </code>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '6px',
                    fontSize: '12px',
                    opacity: 0.9,
                  }}
                >
                  Original
                </div>
                <pre
                  style={{
                    background: 'var(--runner-panel-bg)',
                    color: 'var(--runner-text)',
                    padding: '8px',
                    borderRadius: '4px',
                    maxHeight: '40vh',
                    overflow: 'auto',
                    border: '1px solid var(--runner-border)',
                  }}
                >
                  {renderHighlightedYamlLines(
                    toYamlString(orig) || '',
                    toYamlString(curr) || ''
                  )}
                </pre>
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '6px',
                    fontSize: '12px',
                    opacity: 0.9,
                  }}
                >
                  Current
                </div>
                <pre
                  style={{
                    background: 'var(--runner-panel-bg)',
                    color: 'var(--runner-text)',
                    padding: '8px',
                    borderRadius: '4px',
                    maxHeight: '40vh',
                    overflow: 'auto',
                    border: '1px solid var(--runner-border)',
                  }}
                >
                  {renderHighlightedYamlLines(
                    toYamlString(curr) || '',
                    toYamlString(orig) || ''
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {isParamsModalOpen && (
        <div
          className="runner-logs-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Parameter changes dialog"
        >
          <div className="runner-logs-modal__content">
            <div className="runner-logs-modal__header">
              <h3 className="runner-logs-modal__title">Parameter changes</h3>
              <button
                className="runner-logs-modal__close"
                aria-label="Close"
                onClick={onCloseParamsModal}
              >
                ×
              </button>
            </div>
            <div className="runner-logs-modal__body">{dialogBody}</div>
            <div className="runner-logs-modal__footer">
              <button className="btn" onClick={onCloseParamsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ControlPanel;
