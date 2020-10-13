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
  kind = 'text',
  empty = '-',
  visible = true,
  inline = true,
  commas = true,
  children
}) => {
  const showElements = React.isValidElement(children);
  const showList = !showElements && Array.isArray(children) && children.length;
  const showValue = !showList && !showElements;

  return (
    visible && (
      <div className="pipeline-metadata__row">
        <h3 className="pipeline-metadata__label">{label}</h3>
        {showList && (
          <MetaDataList
            property={property}
            inline={inline}
            commas={commas}
            kind={kind}
            empty={empty}>
            {children}
          </MetaDataList>
        )}
        {showValue && (
          <MetaDataValue value={children} kind={kind} empty={empty} />
        )}
        {showElements && children}
      </div>
    )
  );
};

export default MetaDataRow;
