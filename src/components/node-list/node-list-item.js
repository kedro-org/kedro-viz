import React from 'react';
import classnames from 'classnames';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
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
          'pipeline-nodelist__item__icon--type--unchecked': !checked,
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
      className={classnames('pipeline-nodelist__item__label', {
        'pipeline-nodelist__item__label--unchecked': !checked
      })}
      dangerouslySetInnerHTML={{ __html: label }}
    />
    {checked ? (
      <VisibleIcon className="pipeline-nodelist__item__icon pipeline-nodelist__item__icon--visibility" />
    ) : (
      <InvisibleIcon className="pipeline-nodelist__item__icon pipeline-nodelist__item__icon--visibility" />
    )}
  </label>
);

export default NodeListItem;
