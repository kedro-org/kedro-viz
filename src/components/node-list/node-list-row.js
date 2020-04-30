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
  const useButton = Boolean(onClick && !disabled && checked);
  const Text = useButton ? 'button' : 'div';

  return (
    <div
      className={classnames('pipeline-nodelist__row kedro', {
        'pipeline-nodelist__row--button': useButton,
        'pipeline-nodelist__row--active': active,
        'pipeline-nodelist__row--selected': selected,
        'pipeline-nodelist__row--disabled': disabled
      })}
      onMouseEnter={useButton ? onMouseEnter : null}
      onMouseLeave={useButton ? onMouseLeave : null}>
      <Text
        className="pipeline-nodelist__row__text"
        onClick={useButton ? onClick : null}
        onFocus={useButton ? onMouseEnter : null}
        onBlur={useButton ? onMouseLeave : null}
        disabled={disabled}
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
            'pipeline-nodelist__row__label--faded': disabled || !checked
          })}
          dangerouslySetInnerHTML={{ __html: label }}
        />
      </Text>
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
