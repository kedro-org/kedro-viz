import React from 'react';
import MetaDataList from './metadata-list';
import MetaDataValue from './metadata-value';
import './styles/metadata.css';

/**
 * Shows metadata label and a given single value, or a list of values, or child elements
 */
const MetaDataRow = ({
  label,
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
  const multipleProps = Array.isArray(property);
  return (
    visible && (
      <>
        <dt className="pipeline-metadata__label">{label}</dt>
        <dd className="pipeline-metadata__row" data-label={label}>
          {multipleProps &&
            Object.keys(value).map((prop, index) => (
              <MetaDataList
                key={index}
                property=""
                inline={true}
                commas={true}
                kind={`${kind}--${prop}`}
                empty={null}
                values={value[prop]}
                limit={limit}
              />
            ))}
          {!multipleProps && showList && (
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
          {!multipleProps && !showList && !children && (
            <MetaDataValue value={value} kind={kind} empty={empty} />
          )}
          {children}
        </dd>
      </>
    )
  );
};

export default MetaDataRow;
