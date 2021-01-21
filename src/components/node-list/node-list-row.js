import React, { memo } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { changed } from '../../utils';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import { getNodeActive } from '../../selectors/nodes';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 36.59375;

/**
 * Returns `true` if there are no props changes, therefore the last render can be reused.
 * Performance: Checks only the minimal set of props known to change after first render.
 */
const shouldMemo = (prevProps, nextProps) =>
  !changed(
    [
      'active',
      'checked',
      'unset',
      'allUnset',
      'disabled',
      'faded',
      'visible',
      'selected',
      'label',
      'children'
    ],
    prevProps,
    nextProps
  );

const NodeListRow = memo(
  ({
    container: Container = 'div',
    active,
    checked,
    unset,
    allUnset,
    children,
    disabled,
    faded,
    visible,
    id,
    label,
    name,
    kind,
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
    const isButton = onClick && kind !== 'filter';
    const TextButton = isButton ? 'button' : 'div';

    return (
      <Container
        className={classnames(
          'pipeline-nodelist__row kedro',
          `pipeline-nodelist__row--kind-${kind}`,
          {
            'pipeline-nodelist__row--visible': visible,
            'pipeline-nodelist__row--active': active,
            'pipeline-nodelist__row--selected': selected,
            'pipeline-nodelist__row--disabled': disabled,
            'pipeline-nodelist__row--unchecked': !checked
          }
        )}
        title={name}
        onMouseEnter={visible ? onMouseEnter : null}
        onMouseLeave={visible ? onMouseLeave : null}>
        <TextButton
          className="pipeline-nodelist__row__text"
          onClick={onClick}
          onFocus={onMouseEnter}
          onBlur={onMouseLeave}
          disabled={isButton && (disabled || !checked)}
          title={children ? null : name}>
          {type && (
            <NodeIcon
              className={classnames(
                'pipeline-nodelist__row__type-icon',
                'pipeline-nodelist__row__icon',
                {
                  'pipeline-nodelist__row__type-icon--faded': faded,
                  'pipeline-nodelist__row__type-icon--disabled': disabled,
                  'pipeline-nodelist__row__type-icon--nested': !children,
                  'pipeline-nodelist__row__type-icon--active': active,
                  'pipeline-nodelist__row__type-icon--selected': selected
                }
              )}
              type={type}
            />
          )}
          <span
            className={classnames(
              'pipeline-nodelist__row__label',
              `pipeline-nodelist__row__label--kind-${kind}`,
              {
                'pipeline-nodelist__row__label--faded': faded,
                'pipeline-nodelist__row__label--disabled': disabled
              }
            )}
            dangerouslySetInnerHTML={{ __html: label }}
          />
        </TextButton>
        {children}
        <label
          htmlFor={id}
          className={classnames('pipeline-row__toggle', {
            'pipeline-row__toggle--disabled': disabled,
            'pipeline-row__toggle--selected': selected,
            'pipeline-row__toggle--not-tag': type !== 'tag'
          })}>
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
              'pipeline-nodelist__row__icon',
              'pipeline-row__toggle-icon',
              `pipeline-row__toggle-icon--kind-${kind}`,
              {
                'pipeline-row__toggle-icon--parent': Boolean(children),
                'pipeline-row__toggle-icon--child': !children,
                'pipeline-row__toggle-icon--checked': checked,
                'pipeline-row__toggle-icon--unchecked': !checked,
                'pipeline-row__toggle-icon--unset': unset,
                'pipeline-row__toggle-icon--all-unset': allUnset
              }
            )}
          />
        </label>
      </Container>
    );
  },
  shouldMemo
);

export const mapStateToProps = (state, ownProps) => ({
  ...ownProps,
  active:
    typeof ownProps.active !== 'undefined'
      ? ownProps.active
      : getNodeActive(state)[ownProps.id] || false
});

export default connect(mapStateToProps)(NodeListRow);
