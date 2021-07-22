import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { changed } from '../../utils';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import FocusModeIcon from '../icons/focus-mode';
import { getNodeActive } from '../../selectors/nodes';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 37;

/**
 * Returns `true` if there are no props changes, therefore the last render can be reused.
 * Performance: Checks only the minimal set of props known to change after first render.
 */
const shouldMemo = (prevProps, nextProps) =>
  !changed(
    [
      'active',
      'checked',
      'allUnchecked',
      'disabled',
      'faded',
      'visible',
      'selected',
      'label',
      'children',
      'count',
    ],
    prevProps,
    nextProps
  );

const NodeListRow = memo(
  ({
    container: Container = 'div',
    active,
    checked,
    allUnchecked,
    children,
    disabled,
    faded,
    visible,
    id,
    label,
    count,
    name,
    kind,
    onMouseEnter,
    onMouseLeave,
    onChange,
    onClick,
    selected,
    type,
    icon,
    visibleIcon = VisibleIcon,
    invisibleIcon = InvisibleIcon,
    rowType,
    focusMode,
    parentDisabled,
    parentPipeline,
  }) => {
    const VisibilityIcon =
      type === 'modularPipeline'
        ? FocusModeIcon
        : checked
        ? visibleIcon
        : invisibleIcon;
    const isButton = onClick && kind !== 'filter';
    const TextButton = isButton ? 'button' : 'div';

    const determineFocusMode = useCallback(
      () =>
        focusMode !== null &&
        type === 'modularPipeline' &&
        id === focusMode?.id,
      [focusMode, type, id]
    );
    const isInFocusMode = determineFocusMode();

    const determineDisabledLabel = useCallback(() => {
      if (parentPipeline === 'main') {
        return disabled;
      }
      return (
        parentDisabled !== false && disabled === true && isInFocusMode === false
      );
    }, [parentDisabled, disabled, isInFocusMode, parentPipeline]);

    const isDisabledLabel = determineDisabledLabel();

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
            'pipeline-nodelist__row--unchecked': !checked,
          }
        )}
        title={name}
        onMouseEnter={visible ? onMouseEnter : null}
        onMouseLeave={visible ? onMouseLeave : null}>
        {icon && (
          <NodeIcon
            className={classnames(
              'pipeline-nodelist__row__type-icon',
              'pipeline-nodelist__row__icon',
              {
                'pipeline-nodelist__row__type-icon--faded': faded,
                'pipeline-nodelist__row__type-icon--disabled': disabled,
                'pipeline-nodelist__row__type-icon--nested': !children,
                'pipeline-nodelist__row__type-icon--active': active,
                'pipeline-nodelist__row__type-icon--selected': selected,
              }
            )}
            icon={icon}
          />
        )}
        <TextButton
          className={classnames(
            'pipeline-nodelist__row__text',
            `pipeline-nodelist__row__text--kind-${kind}`,
            `pipeline-nodelist__row__text--${rowType}`
          )}
          onClick={onClick}
          onFocus={onMouseEnter}
          onBlur={onMouseLeave}
          title={children ? null : name}>
          <span
            className={classnames(
              'pipeline-nodelist__row__label',
              `pipeline-nodelist__row__label--kind-${kind}`,
              {
                'pipeline-nodelist__row__label--faded': faded,
                'pipeline-nodelist__row__label--disabled': isDisabledLabel,
              }
            )}
            dangerouslySetInnerHTML={{ __html: label }}
          />
        </TextButton>
        {typeof count === 'number' && (
          <span onClick={onClick} className={'pipeline-nodelist__row__count'}>
            {count}
          </span>
        )}
        <label
          htmlFor={id}
          className={classnames(
            'pipeline-row__toggle',
            `pipeline-row__toggle--kind-${kind}`,
            {
              'pipeline-row__toggle--disabled': disabled,
              'pipeline-row__toggle--selected': selected,
            }
          )}>
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
            checked={checked}
            className={classnames(
              'pipeline-nodelist__row__icon',
              'pipeline-row__toggle-icon',
              `pipeline-row__toggle-icon--kind-${kind}`,
              {
                'pipeline-row__toggle-icon--parent': Boolean(children),
                'pipeline-row__toggle-icon--child': !children,
                'pipeline-row__toggle-icon--checked': checked,
                'pipeline-row__toggle-icon--unchecked': !checked,
                'pipeline-row__toggle-icon--all-unchecked': allUnchecked,
                'pipeline-row__toggle-icon--focus-checked': isInFocusMode,
              }
            )}
          />
        </label>
        {children}
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
      : getNodeActive(state)[ownProps.id] || false,
});

export default connect(mapStateToProps)(NodeListRow);
