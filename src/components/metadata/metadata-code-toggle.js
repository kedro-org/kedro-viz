import React from 'react';
import modifiers from '../../utils/modifiers';
import './styles/metadata.css';

/**
 * Shows a toggle button for code panel
 */
const MetaCodeToggle = ({ showCode, hasCode, onChange }) => (
  <div
    className={modifiers('pipeline-metadata__code-toggle', {
      hasCode,
    })}>
    <input
      id="pipeline-metadata__code-toggle-input"
      className="pipeline-metadata__code-toggle-input"
      type="checkbox"
      checked={showCode}
      disabled={!hasCode}
      onChange={onChange}
    />
    <label
      className={modifiers('pipeline-metadata__code-toggle-label', {
        checked: hasCode && showCode,
      })}
      htmlFor="pipeline-metadata__code-toggle-input">
      Show Code
    </label>
  </div>
);

export default MetaCodeToggle;
