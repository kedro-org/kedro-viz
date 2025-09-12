import React, { useState, useEffect, useCallback } from 'react';
import { toYamlString, parseYamlishValue } from '../utils/yamlUtils';
import './ParamMetadataEditor.scss';

/**
 * ParamMetadataEditor
 * Owns its internal YAML text (metaEditText equivalent) and save/reset logic.
 */
function ParamMetadataEditor({
  key, // Added key prop to force remount on param change
  paramValue,
  onSave,
  onReset,
  showToast,
  disabled,
}) {
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);

  // Ensure draft is in sync with paramValue changes
  useEffect(() => {
    // Do not overwrite unsaved user edits
    if (draft !== null || dirty) {
      return;
    }

    try {
      const base = paramValue;
      if (typeof base === 'undefined') {
        setDraft(null);
        return;
      }
      const yaml = toYamlString(base);
      setDraft(yaml);
      setDirty(false);
      setError(null);
    } catch (e) {
      setDraft(e);
      setError('Failed to load parameter');
    }
  }, [key, paramValue, draft, dirty]);

  const onChange = useCallback((e) => {
    setDraft(e.target.value);
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (disabled || draft === null) {
      return;
    }
    try {
      const parsed = parseYamlishValue(draft);
      onSave(parsed);
      setDirty(false);
      setError(null);
      showToast && showToast('Parameter updated');
    } catch (e) {
      setError('Invalid YAML');
      showToast && showToast('Failed to update');
    }
  }, [draft, disabled, onSave, showToast]);

  const handleReset = useCallback(() => {
    if (disabled || draft === null) {
      return;
    }
    try {
      onReset();
    } finally {
      const yaml = toYamlString(paramValue);
      setDraft(yaml);
      setDirty(false);
      setError(null);
      showToast && showToast('Reset to original');
    }
  }, [disabled, onReset, paramValue, showToast]);

  return (
    <article
      key={key}
      className={`param-metadata-editor__${key} ${
        disabled ? '--disabled' : ''
      }`}
    >
      <div className="param-meta-editor__inner">
        <h3 className="pipeline-metadata__title pipeline-metadata__title--small param-meta-editor__heading">
          Edit parameters
        </h3>
        <textarea
          className="runner-meta-editor"
          value={draft}
          onChange={onChange}
          spellCheck={false}
          disabled={disabled || draft === null}
          aria-label="Parameter YAML editor"
        />
        <div className="param-meta-editor__actions">
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={disabled || draft === null || (!dirty && !error)}
          >
            Save
          </button>
          <button
            className="btn"
            onClick={handleReset}
            disabled={disabled || draft === null}
          >
            Reset
          </button>
          {dirty && !error && (
            <span className="param-meta-editor__status param-meta-editor__status--dirty">
              Unsaved changes
            </span>
          )}
          {error && (
            <span className="param-meta-editor__status param-meta-editor__status--error">
              {error}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default ParamMetadataEditor;
