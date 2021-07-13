import React from 'react';
import modifiers from '../../utils/modifiers';
import './styles/metadata.css';
import ReactJson from 'react-json-view';
import {
  darkjsonViewerTheme,
  lightjsonViewerTheme,
} from './metadata-parameters-theme';

/**
 * Shows a metadata object
 */
const MetaDataObject = ({ className, value, kind, theme }) => (
  <>
    <div
      className={modifiers('pipeline-metadata__object', { kind }, className)}>
      <ReactJson
        theme={theme === 'dark' ? darkjsonViewerTheme : lightjsonViewerTheme}
        style={{
          fontFamily: "Consolas, Monaco, 'Courier New', Courier, monospace",
        }}
        name={false}
        indentWidth={1}
        collapsed={1}
        collapseStringsAfterLength={true}
        enableClipboard={true}
        displayDataTypes={false}
        src={value}></ReactJson>
    </div>
  </>
);

export default MetaDataObject;
