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

/**
 * Shows metadata label and value
 */
const MetaDataRow = ({
  label,
  property,
  kind = 'text',
  inline = true,
  commas = true,
  empty = '-',
  children
}) => {
  const renderValue = value =>
    React.isValidElement(value) ? (
      value
    ) : (
      <MetaDataValue value={value} kind={kind} empty={empty} />
    );

  return (
    <div className="pipeline-metadata__row">
      <h3 className="pipeline-metadata__label">{label}</h3>
      {Array.isArray(children) && children.length > 0 ? (
        <ul
          className={modifiers('pipeline-metadata__value-list', {
            inline,
            commas
          })}>
          {children.map((item, index) => (
            <li key={index}>{renderValue(property ? item[property] : item)}</li>
          ))}
        </ul>
      ) : (
        renderValue(children)
      )}
    </div>
  );
};

export default MetaDataRow;
