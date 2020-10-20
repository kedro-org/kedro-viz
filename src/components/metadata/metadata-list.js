import React from 'react';
import modifiers from '../../utils/modifiers';
import MetaDataValue from './metadata-value';
import './styles/metadata.css';

/**
 * Shows a list of MetaDataValue
 */
const MetaDataList = ({
  property,
  values = [],
  kind = 'text',
  empty = '-',
  inline = true,
  commas = true
}) => (
  <ul
    className={modifiers('pipeline-metadata__value-list', {
      inline,
      commas
    })}>
    {values.map((item, index) => (
      <li key={index}>
        <MetaDataValue
          value={property ? item[property] : item}
          kind={kind}
          empty={empty}
        />
      </li>
    ))}
  </ul>
);

export default MetaDataList;
