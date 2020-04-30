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
  selected,
  type
}) => {
  const VisibilityIcon = checked ? VisibleIcon : InvisibleIcon;
  const visible = Boolean(onClick && !disabled && checked);
  const faded = disabled || !checked;

  return (
    <div
      className={classnames('pipeline-nodelist__row kedro', {
        'pipeline-nodelist__row--visible': visible,
        'pipeline-nodelist__row--active': active,
        'pipeline-nodelist__row--selected': selected,
        'pipeline-nodelist__row--disabled': disabled
      })}
      onMouseEnter={visible ? onMouseEnter : null}
      onMouseLeave={visible ? onMouseLeave : null}>
      <button
        className="pipeline-nodelist__row__text"
        onClick={onClick}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        disabled={!visible}
        title={children ? null : name}>
        <NodeIcon
          className={classnames(
            'pipeline-nodelist__row__type-icon pipeline-nodelist__row__icon',
            {
              'pipeline-nodelist__row__type-icon--faded': faded,
              'pipeline-nodelist__row__type-icon--nested': !children
            }
          )}
          type={type}
        />
        <span
          className={classnames('pipeline-nodelist__row__label', {
            'pipeline-nodelist__row__label--faded': faded
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
