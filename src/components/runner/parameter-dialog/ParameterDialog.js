import { useState } from 'react';
import { quoteIfNeeded } from '../utils/paramsDiff';
import { toYamlString } from '../utils/yamlUtils';
import './ParameterDialog.css';

function renderHighlightedYamlLines(text, otherText) {
  const a = String(text == null ? '' : text).split(/\r?\n/);
  const b = String(otherText == null ? '' : otherText).split(/\r?\n/);
  const max = Math.max(a.length, b.length);
  return Array.from({ length: max }).map((_, i) => {
    const line = a[i] ?? '';
    const changed = (a[i] ?? '') !== (b[i] ?? '');
    const lineClass = changed
      ? 'param-dialog__yaml-line param-dialog__yaml-line--changed'
      : 'param-dialog__yaml-line';
    return <div key={i} className={lineClass}>{line || ' '}</div>;
  });
}

const ParameterDialog = ({ onClose, diffModel = [], paramsArgString }) => {
  const [selectedKey, onSelectKey] = useState(null);

  const items = diffModel || [];
  const selectedItem = items.find((i) => i.key === selectedKey) || items[0];
  const orig = selectedItem ? selectedItem.original : undefined;
  const curr = selectedItem ? selectedItem.edited : undefined;
  const perParamArg = `--params ${quoteIfNeeded(
    (selectedItem?.pairs || []).join(',')
  )}`;
  const combinedParamsArg = `--params ${quoteIfNeeded(paramsArgString || '')}`;
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
            <div className="param-dialog__arg-code">
              <code className="param-dialog__arg-code-inner">{combinedParamsArg}</code>
            </div>
            <div className="param-dialog__panel">
              <div className="param-dialog__panel-header">
                <div className="param-dialog__panel-header-label">Selected parameter</div>
                <select
                  id="param-changes-select"
                  aria-label="Selected parameter"
                  value={selectedKey}
                  onChange={(e) => onSelectKey(e.target.value)}
                  className="param-dialog__select"
                >
                  {items.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.name || item.key}
                    </option>
                  ))}
                </select>
              </div>
              <div className="param-dialog__panel-body">
                <div className="param-dialog__per-param-arg">
                  <code className="param-dialog__arg-code-inner param-dialog__arg-code-inner--spaced">{perParamArg}</code>
                </div>
                <div className="param-dialog__diff-grid">
                  <div>
                    <div className="param-dialog__diff-title">Original</div>
                    <pre className="param-dialog__yaml-pre">
                      {renderHighlightedYamlLines(
                        toYamlString(orig) || '',
                        toYamlString(curr) || ''
                      )}
                    </pre>
                  </div>
                  <div>
                    <div className="param-dialog__diff-title">Current</div>
                    <pre className="param-dialog__yaml-pre">
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
