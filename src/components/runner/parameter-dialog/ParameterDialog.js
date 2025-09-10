import React from 'react';
import { quoteIfNeeded } from '../utils/paramsDiff';
import { toYamlString } from '../utils/yamlUtils';

const ParameterDialog = ({
  isOpen,
  onClose,
  diffModel = [],
  paramsArgString,
  selectedKey: externalSelectedKey,
  onSelectKey,
  renderHighlightedYamlLines,
}) => {
  if (!isOpen) {
    return null;
  }
  const items = diffModel || [];
  const selectedKey = externalSelectedKey || (items[0] && items[0].key);
  const selectedItem = items.find((i) => i.key === selectedKey) || items[0];
  const orig = selectedItem ? selectedItem.original : undefined;
  const curr = selectedItem ? selectedItem.edited : undefined;
  const perParamArg = `--params ${quoteIfNeeded(
    (selectedItem?.pairs || []).join(',')
  )}`;
  const combinedParamsArg = `--params ${quoteIfNeeded(paramsArgString || '')}`;
  const argCodeStyle = {
    fontFamily: 'monospace',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    lineBreak: 'anywhere',
  };
  return (
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
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="runner-logs-modal__body">
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
                  onChange={(e) => onSelectKey(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {items.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.name || item.key}
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
        </div>
        <div className="runner-logs-modal__footer">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterDialog;
