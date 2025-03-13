import React from 'react';
import classnames from 'classnames';
import { replaceAngleBracketMatches } from '../../../utils';
import { getDataTestAttribute } from '../../../utils/get-data-test-attribute';

import './row-text.scss';

export const RowText = ({
  dataTest,
  disabled,
  faded,
  kind,
  label,
  name,
  onClick,
  onMouseEnter,
  onMouseLeave,
  rowType,
}) => {
  return (
    <button
      className={classnames(
        'row-text',
        `row-text--kind-${kind}`,
        `row-text--${rowType}`,
        {
          'row-text--faded': faded,
        }
      )}
      data-test={getDataTestAttribute(dataTest, label)}
      onClick={onClick}
      onFocus={onMouseEnter}
      onBlur={onMouseLeave}
      title={name}
    >
      <span
        className={classnames(
          'row-text__label',
          `row-text__label--kind-${kind}`,
          {
            'row-text__label--faded': faded,
            'row-text__label--disabled': disabled,
          }
        )}
        dangerouslySetInnerHTML={{
          __html: replaceAngleBracketMatches(label),
        }}
      />
    </button>
  );
};
