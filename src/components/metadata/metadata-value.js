import React from 'react';
import modifiers from '../../utils/modifiers';
import './styles/metadata.css';

/**
 * Shows a metadata value
 */
const MetaDataValue = ({
  container: Container = 'span',
  className,
  value,
  kind,
  empty,
}) => (
  <Container
    title={value}
    className={modifiers('pipeline-metadata__value', { kind }, className)}>
    {!value && value !== 0 ? empty : value}
  </Container>
);

export default MetaDataValue;
