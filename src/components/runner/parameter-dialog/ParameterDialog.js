import React from 'react';

// Helper utilities (kept local to dialog)
const quoteIfNeeded = (text) => {
  if (!text) { return ''; }
  const str = String(text);
  return /\s/.test(str) ? `"${str.replace(/"/g, '\\"')}"` : str;
};

const normalizeParamPrefix = (text) => {
  if (text == null || text === '') { return ''; }
  try { return String(text).replace(/^params:/, ''); } catch { return text; }
};

const formatParamValueForCli = (value) => {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') { return String(value); }
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
    if (typeof edited === 'undefined') { return pairs; }
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
      if (typeof editedVal === 'undefined') { return; }
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

const ParameterDialog = ({
  isOpen,
  onClose,
  paramItems = [],
  paramOriginals = {},
  getParamValue,
  getEditedParamValue,
  paramsArgString,
  paramsDialogSelectedKey,
  onSelectParamKey,
  toYamlString,
  renderHighlightedYamlLines,
}) => {
  if (!isOpen) { return null; }
  const selectedKey = paramsDialogSelectedKey || (paramItems[0] && paramItems[0].id);
  const selectedItem = paramItems.find((i) => i.id === selectedKey) || paramItems[0];
  const originals = paramOriginals || {};
  const orig = Object.prototype.hasOwnProperty.call(originals, selectedKey) ? originals[selectedKey] : getParamValue(selectedKey);
  const curr = getEditedParamValue(selectedKey);
  const prefixName = normalizeParamPrefix((selectedItem && selectedItem.name) || selectedKey);
  const perPairs = collectParamDiffs(orig, curr, prefixName);
  const perParamArg = `--params ${quoteIfNeeded(perPairs.join(','))}`;
  const combinedParamsArg = `--params ${quoteIfNeeded(paramsArgString || '')}`;
  const argCodeStyle = { fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', lineBreak: 'anywhere' };
  return (
    <div className="runner-logs-modal" role="dialog" aria-modal="true" aria-label="Parameter changes dialog">
      <div className="runner-logs-modal__content">
        <div className="runner-logs-modal__header">
          <h3 className="runner-logs-modal__title">Parameter changes</h3>
          <button className="runner-logs-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="runner-logs-modal__body">
          <div>
            <div style={argCodeStyle}><code>{combinedParamsArg}</code></div>
            <div style={{ marginTop: '10px', border: '1px solid var(--runner-border)', background: 'var(--runner-subpanel-bg)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '12px', padding: '10px 12px', borderBottom: '1px solid var(--runner-border)', background: 'var(--runner-subpanel-header-bg)' }}>
                <div style={{ fontWeight: 700 }}>Selected parameter</div>
                <select id="param-changes-select" aria-label="Selected parameter" value={selectedKey} onChange={(e) => onSelectParamKey(e.target.value)} style={{ width: '100%' }}>
                  {paramItems.map((item) => (<option key={item.id} value={item.id}>{item.name || item.id}</option>))}
                </select>
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '10px' }}>
                  <code style={{ ...argCodeStyle, marginBottom: '10px' }}>{perParamArg}</code>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '12px', opacity: 0.9 }}>Original</div>
                    <pre style={{ background: 'var(--runner-panel-bg)', color: 'var(--runner-text)', padding: '8px', borderRadius: '4px', maxHeight: '40vh', overflow: 'auto', border: '1px solid var(--runner-border)' }}>
                      {renderHighlightedYamlLines(toYamlString(orig) || '', toYamlString(curr) || '')}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '12px', opacity: 0.9 }}>Current</div>
                    <pre style={{ background: 'var(--runner-panel-bg)', color: 'var(--runner-text)', padding: '8px', borderRadius: '4px', maxHeight: '40vh', overflow: 'auto', border: '1px solid var(--runner-border)' }}>
                      {renderHighlightedYamlLines(toYamlString(curr) || '', toYamlString(orig) || '')}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="runner-logs-modal__footer"><button className="btn" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
};

export default ParameterDialog;