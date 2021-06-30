import React from 'react';
import modifiers from '../../utils/modifiers';
import './styles/metadata.css';
import ReactJson from 'react-json-view';
import {
  darkjsonViewerTheme,
  lightjsonViewerTheme,
} from './metadata-parameters-theme';

/**
 * Shows a metadata value
 */
const MetaDataValue = ({
  container: Container = 'span',
  className,
  value,
  kind,
  empty,
  theme,
}) => (
  <>
    {kind === 'parameters' && (
      <>
        <div
          className={modifiers(
            'pipeline-metadata__value',
            { kind },
            className
          )}>
          <ReactJson
            theme={
              theme === 'dark' ? darkjsonViewerTheme : lightjsonViewerTheme
            }
            name={false}
            indentWidth={1}
            collapsed={1}
            collapseStringsAfterLength={true}
            enableClipboard={true}
            displayDataTypes={false}
            src={value}></ReactJson>
        </div>
      </>
    )}
    {kind !== 'parameters' && (
      <Container
        title={value}
        className={modifiers('pipeline-metadata__value', { kind }, className)}>
        {!value && value !== 0 ? empty : value}
      </Container>
    )}
  </>
);

export default MetaDataValue;
