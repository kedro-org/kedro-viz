import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ParamMetadataEditor
 * Owns its internal YAML text (metaEditText equivalent) and save/reset logic.
 */
function ParamMetadataEditor({
  key, // Added key prop to force remount on param change
  // getParamValue,
  paramValue,
  toYamlString,
  parseYamlishValue,
  onSave,
  onReset,
  showToast,
  disabled,
  developerView = false,
}) {
  const isInitialized = useRef(true); // Track if component is mounted
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);

  // Ensure draft is in sync with paramValue changes
  useEffect(() => {
    if (!isInitialized.current || draft !== null || dirty) {
      // Do not overwrite unsaved user edits
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
  }, [key, isInitialized, paramValue, toYamlString]);

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
  }, [draft, disabled, parseYamlishValue, onSave, showToast]);

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
  }, [disabled, onReset, paramValue, toYamlString, showToast]);

  return (
    <div style={{ margin: '0 36px 24px' }}>
      <h3
        className="pipeline-metadata__title pipeline-metadata__title--small"
        style={{ margin: '0 0 8px' }}
      >
        Edit parameters
      </h3>
      {() => {
        if (developerView) {
          // Developer view of internal state
          return (
            <div>
              <h4>Internal State</h4>
              <div>
                {' '}
                <pre>{`paramValue = ${JSON.stringify(
                  paramValue,
                  null,
                  2
                )}`}</pre>
              </div>
              <div>
                {' '}
                <pre>{`draft = ${JSON.stringify(draft, null, 2)}`}</pre>
              </div>
              <div>
                {' '}
                <pre>{`dirty = ${JSON.stringify(dirty, null, 2)}`}</pre>
              </div>
              <div>
                {' '}
                <pre>{`error = ${JSON.stringify(error, null, 2)}`}</pre>
              </div>
            </div>
          );
        }
      }}
      <textarea
        className="runner-meta-editor"
        value={draft}
        onChange={onChange}
        spellCheck={false}
        disabled={disabled || draft === null}
        aria-label="Parameter YAML editor"
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
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
          <span style={{ fontSize: 12, alignSelf: 'center', opacity: 0.8 }}>
            Unsaved changes
          </span>
        )}
        {error && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-danger)',
              alignSelf: 'center',
            }}
          >
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

export default ParamMetadataEditor;
