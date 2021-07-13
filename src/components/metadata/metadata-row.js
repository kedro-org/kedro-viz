import React from 'react';
import MetaDataList from './metadata-list';
import MetaDataObject from './metadata-object';
import MetaDataValue from './metadata-value';
import './styles/metadata.css';

/**
 * Shows metadata label and a given single value, or a list of values, or child elements
 */
const MetaDataRow = ({
  label,
  theme,
  property,
  value,
  kind = 'text',
  empty = '-',
  visible = true,
  inline = true,
  commas = true,
  limit = false,
  children,
}) => {
  const showList = Array.isArray(value);
  const showObject = typeof value === 'object' && value !== null && !showList;
  return (
    visible && (
      <>
        <dt className="pipeline-metadata__label">{label}</dt>
        <dd className="pipeline-metadata__row" data-label={label}>
          {showList && (
            <MetaDataList
              property={property}
              inline={inline}
              commas={commas}
              kind={kind}
              empty={empty}
              values={value}
              limit={limit}
            />
          )}
          {!showList && !showObject && !children && (
            <MetaDataValue
              value={value}
              kind={kind}
              empty={empty}
              theme={theme}
            />
          )}
          {showObject && Object.keys(value).length > 0 && (
            <MetaDataObject value={value} kind={kind} theme={theme} />
          )}
          {children}
        </dd>
      </>
    )
  );
};

export default MetaDataRow;
