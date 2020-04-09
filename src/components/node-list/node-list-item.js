import React from 'react';
import classnames from 'classnames';
import NodeIcon from '../icons/node-icon';
import InvisibleIcon from '../icons/invisible';

export const NodeListItem = ({
  active,
  checked,
  children,
  disabled,
  label,
  name,
  onMouseEnter,
  onMouseLeave,
  onChange,
  type
}) => (
  <label
    className={classnames('pipeline-nodelist__item kedro', {
      'pipeline-nodelist__item--nested': !children,
      'pipeline-nodelist__item--active': active,
      'pipeline-nodelist__item--unchecked': !checked,
      'pipeline-nodelist__item--disabled': disabled
    })}
    title={children ? null : name}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}>
    {children}
    <NodeIcon
      className={classnames(
        'pipeline-nodelist__item__icon pipeline-nodelist__item__icon--type',
        {
          'pipeline-nodelist__item__icon--type--nested': !children
        }
      )}
      type={type}
    />
    <input
      className="pipeline-nodelist__item__checkbox"
      type="checkbox"
      checked={checked}
      name={name}
      onChange={onChange}
    />
    <span
      className="pipeline-nodelist__item__label"
      dangerouslySetInnerHTML={{ __html: label }}
    />
    <InvisibleIcon
      className={classnames(
        'pipeline-nodelist__item__icon pipeline-nodelist__item__icon--invisible',
        {
          'pipeline-nodelist__item__icon--invisible--checked': checked
        }
      )}
    />
  </label>
);

export default NodeListItem;
