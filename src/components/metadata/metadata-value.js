import React from 'react';
import modifiers from '../../utils/modifiers';
import './styles/metadata.css';

/**
 * Shows a metadata value
 */
const MetaDataValue = ({ value, kind, empty }) => (
  <span className={modifiers('pipeline-metadata__value', { kind })}>
    {(!value && value !== 0) || value.length === 0 ? empty : value}
  </span>
);

export default MetaDataValue;
