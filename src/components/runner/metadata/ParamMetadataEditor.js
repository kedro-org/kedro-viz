import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ParamMetadataEditor
 * Owns its internal YAML text (metaEditText equivalent) and save/reset logic.
 * Props:
 *  - isOpen
 *  - activeParamKey
 *  - paramOriginals
 *  - getParamValue(key)
 *  - toYamlString(obj)
 *  - parseYamlishValue(text)
 *  - editParamInEditor(key, parsedValue)
 *  - resetParamInEditor(key)
 *  - showToast(msg)
 *  - disabled (optional)
 */
function ParamMetadataEditor({
  isOpen,
  activeParamKey,
  paramOriginals,
  getParamValue,
  toYamlString,
  parseYamlishValue,
  editParamInEditor,
  resetParamInEditor,
  showToast,
  disabled,
}) {
  const [draft, setDraft] = useState('');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const lastLoadedKey = useRef(null);

  // Load initial YAML for active param or when original value changes (e.g., external reset)
  useEffect(() => {
    if (!activeParamKey) {
      return;
    }
    const base =
      paramOriginals[activeParamKey] ?? getParamValue(activeParamKey);
    try {
      const yaml = toYamlString(base) || '';
      setDraft(yaml);
      setDirty(false);
      setError(null);
      lastLoadedKey.current = activeParamKey;
    } catch (e) {
      setDraft('');
      setError('Failed to load parameter');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParamKey, paramOriginals]);

  const onChange = useCallback((e) => {
    setDraft(e.target.value);
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (disabled || !activeParamKey) {
      {
        return;
      }
    }
    try {
      const parsed = parseYamlishValue(draft);
      editParamInEditor(activeParamKey, parsed);
      setDirty(false);
      setError(null);
      showToast && showToast('Parameter updated');
    } catch (e) {
      setError('Invalid YAML');
      showToast && showToast('Failed to update');
    }
  }, [
    draft,
    disabled,
    activeParamKey,
    parseYamlishValue,
    editParamInEditor,
    showToast,
  ]);

  const handleReset = useCallback(() => {
    if (disabled || !activeParamKey) {
      return;
    }
    try {
      resetParamInEditor(activeParamKey);
    } finally {
      const base =
        paramOriginals[activeParamKey] ?? getParamValue(activeParamKey);
      const yaml = toYamlString(base) || '';
      setDraft(yaml);
      setDirty(false);
      setError(null);
      showToast && showToast('Reset to original');
    }
  }, [
    activeParamKey,
    disabled,
    resetParamInEditor,
    paramOriginals,
    getParamValue,
    toYamlString,
    showToast,
  ]);

  if (!isOpen || !activeParamKey) {
    return null;
  }

  return (
    <div style={{ margin: '0 36px 24px' }}>
      <h3
        className="pipeline-metadata__title pipeline-metadata__title--small"
        style={{ margin: '0 0 8px' }}
      >
        Edit parameters
      </h3>
      <textarea
        className="runner-meta-editor"
        value={draft}
        onChange={onChange}
        spellCheck={false}
        disabled={disabled}
        aria-label="Parameter YAML editor"
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          className="btn btn--primary"
          onClick={handleSave}
          disabled={disabled || (!dirty && !error)}
        >
          Save
        </button>
        <button className="btn" onClick={handleReset} disabled={disabled}>
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
