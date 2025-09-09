import React, { useMemo, useCallback } from 'react';
import ParameterDialog from '../parameter-dialog/ParameterDialog';

// Local helpers (moved from hooks)
const quoteIfNeeded = (text) => {
  if (!text) {
    return '';
  }
  const str = String(text);
  return /\s/.test(str) ? `"${str.replace(/"/g, '\\"')}"` : str;
};

const normalizeParamPrefix = (text) => {
  if (text == null || text === '') {
    return '';
  }
  try {
    return String(text).replace(/^params:/, '');
  } catch {
    return text;
  }
};

const formatParamValueForCli = (value) => {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'string') {
    const needsQuotes = /[\s,]/.test(value);
    const escaped = value.replace(/"/g, '\\"');
    return needsQuotes ? `"${escaped}"` : escaped;
  }
  return JSON.stringify(value);
};

const collectParamDiffs = (orig, edited, prefix) => {
  const pairs = [];
  if (typeof orig === 'undefined') {
    if (typeof edited === 'undefined') {
      return pairs;
    }
    if (edited && typeof edited === 'object' && !Array.isArray(edited)) {
      Object.keys(edited).forEach((k) => {
        const val = edited[k];
        const keyPath = `${prefix}.${k}`;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          pairs.push(...collectParamDiffs(undefined, val, keyPath));
        } else {
          pairs.push(`${keyPath}=${formatParamValueForCli(val)}`);
        }
      });
    } else {
      pairs.push(`${prefix}=${formatParamValueForCli(edited)}`);
    }
    return pairs;
  }
  if (orig && typeof orig === 'object' && !Array.isArray(orig) && edited && typeof edited === 'object' && !Array.isArray(edited)) {
    const keys = new Set([...Object.keys(orig), ...Object.keys(edited)]);
    keys.forEach((k) => {
      const origVal = orig[k];
      const editedVal = edited[k];
      if (typeof editedVal === 'undefined') {
        return;
      }
      const keyPath = `${prefix}.${k}`;
      if (origVal && typeof origVal === 'object' && !Array.isArray(origVal) && editedVal && typeof editedVal === 'object' && !Array.isArray(editedVal)) {
        pairs.push(...collectParamDiffs(origVal, editedVal, keyPath));
      } else if (JSON.stringify(origVal) !== JSON.stringify(editedVal)) {
        pairs.push(`${keyPath}=${formatParamValueForCli(editedVal)}`);
      }
    });
    return pairs;
  }
  if (JSON.stringify(orig) !== JSON.stringify(edited)) {
    pairs.push(`${prefix}=${formatParamValueForCli(edited)}`);
  }
  return pairs;
};


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
  toYamlString,
  renderHighlightedYamlLines,
  paramsArgString,
  kedroEnv,
}) => {
  const selectedKey = paramsDialogSelectedKey || (paramItems && paramItems[0] && paramItems[0].id);

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
        paramItems={paramItems}
        paramOriginals={paramOriginals}
        getParamValue={getParamValue}
        getEditedParamValue={getEditedParamValue}
        paramsArgString={paramsArgString}
        paramsDialogSelectedKey={paramsDialogSelectedKey}
        onSelectParamKey={onSelectParamKey}
        toYamlString={toYamlString}
        renderHighlightedYamlLines={renderHighlightedYamlLines}
      />
    </section>
  );
};

export default ControlPanel;
