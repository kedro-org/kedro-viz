import React from 'react';
import classnames from 'classnames';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';

const NodeListRow = ({
  active,
  checked,
  children,
  disabled,
  id,
  label,
  name,
  onMouseEnter,
  onMouseLeave,
  onChange,
  onClick,
  type
}) => {
  const VisibilityIcon = checked ? VisibleIcon : InvisibleIcon;

  return (
    <div
      className={classnames('pipeline-nodelist__row kedro', {
        'pipeline-nodelist__row--active': active,
        'pipeline-nodelist__row--disabled': disabled
      })}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      <button
        onClick={onClick}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        disabled={disabled}
        className={classnames('pipeline-nodelist__row__text', {
          'pipeline-nodelist__row__text--active': active,
          'pipeline-nodelist__row__text--unchecked': !checked
        })}
        title={children ? null : name}>
        <NodeIcon
          className={classnames(
            'pipeline-nodelist__row__type-icon pipeline-nodelist__row__icon',
            {
              'pipeline-nodelist__row__type-icon--unchecked': !checked,
              'pipeline-nodelist__row__type-icon--nested': !children
            }
          )}
          type={type}
        />
        <span
          className={classnames('pipeline-nodelist__row__label', {
            'pipeline-nodelist__row__label--active': active,
            'pipeline-nodelist__row__label--disabled': disabled,
            'pipeline-nodelist__row__label--unchecked': !checked
          })}
          dangerouslySetInnerHTML={{ __html: label }}
        />
      </button>
      {children}
      <label htmlFor={id} className="pipeline-nodelist__row__visibility">
        <input
          id={id}
          className="pipeline-nodelist__row__checkbox"
          type="checkbox"
          checked={checked}
          disabled={disabled}
          name={name}
          onChange={onChange}
        />
        <VisibilityIcon
          aria-label={name}
          className={classnames(
            'pipeline-nodelist__row__icon pipeline-nodelist__row__visibility-icon',
            {
              'pipeline-nodelist__row__visibility-icon--unchecked': !checked
            }
          )}
        />
      </label>
    </div>
  );
};

export default NodeListRow;
