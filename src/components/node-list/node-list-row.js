import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import { getNodeActive } from '../../selectors/nodes';

const NodeListRow = ({
  active,
  checked,
  unset,
  children,
  disabled,
  faded,
  visible,
  id,
  label,
  name,
  onMouseEnter,
  onMouseLeave,
  onChange,
  onClick,
  selected,
  type,
  visibleIcon = VisibleIcon,
  invisibleIcon = InvisibleIcon
}) => {
  const VisibilityIcon = checked ? visibleIcon : invisibleIcon;

  return (
    <div
      className={classnames('pipeline-nodelist__row kedro', {
        'pipeline-nodelist__row--visible': visible,
        'pipeline-nodelist__row--active': active,
        'pipeline-nodelist__row--selected': selected,
        'pipeline-nodelist__row--disabled': disabled,
        'pipeline-nodelist__row--unchecked': !checked
      })}
      title={name}
      onMouseEnter={visible ? onMouseEnter : null}
      onMouseLeave={visible ? onMouseLeave : null}>
      <button
        className="pipeline-nodelist__row__text"
        onClick={onClick}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        disabled={disabled}
        title={children ? null : name}>
        {type && (
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
        )}
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
              'pipeline-nodelist__row__visibility-icon--checked': checked,
              'pipeline-nodelist__row__visibility-icon--unchecked': !checked,
              'pipeline-nodelist__row__visibility-icon--unset': unset
            }
          )}
        />
      </label>
    </div>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  ...ownProps,
  active:
    typeof ownProps.active !== 'undefined'
      ? ownProps.active
      : getNodeActive(state)[ownProps.id] || false
});

export default connect(mapStateToProps)(NodeListRow);
