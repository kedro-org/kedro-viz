import React, { memo } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { changed, replaceMatches } from '../../utils';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import FocusModeIcon from '../icons/focus-mode';
import { getNodeActive } from '../../selectors/nodes';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 37;

// This allows lambda and partial Python functions to render via dangerouslySetInnerHTML
const replaceTagsWithEntities = {
  '<lambda>': '&lt;lambda&gt;',
  '<partial>': '&lt;partial&gt;',
};

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
      'focused',
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
    focused,
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
    focusModeIcon = FocusModeIcon,
    rowType,
  }) => {
    const VisibilityIcon =
      type === 'modularPipeline'
        ? focusModeIcon
        : checked
        ? visibleIcon
        : invisibleIcon;
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
            'pipeline-nodelist__row--unchecked': !checked,
            'pipeline-nodelist__row--overwrite': !(active || selected),
          }
        )}
        title={name}
        onMouseEnter={visible ? onMouseEnter : null}
        onMouseLeave={visible ? onMouseLeave : null}
      >
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
          data-heap-event={`clicked.sidebar.${icon}`}
          onClick={onClick}
          onFocus={onMouseEnter}
          onBlur={onMouseLeave}
          title={children ? null : name}
        >
          <span
            className={classnames(
              'pipeline-nodelist__row__label',
              `pipeline-nodelist__row__label--kind-${kind}`,
              {
                'pipeline-nodelist__row__label--faded': faded,
                'pipeline-nodelist__row__label--disabled': disabled,
              }
            )}
            dangerouslySetInnerHTML={{
              __html: replaceMatches(label, replaceTagsWithEntities),
            }}
          />
        </TextButton>
        {typeof count === 'number' && (
          <span onClick={onClick} className={'pipeline-nodelist__row__count'}>
            {count}
          </span>
        )}
        {VisibilityIcon && (
          <label
            htmlFor={id}
            className={classnames(
              'pipeline-row__toggle',
              `pipeline-row__toggle--kind-${kind}`,
              {
                'pipeline-row__toggle--disabled': disabled,
                'pipeline-row__toggle--selected': selected,
              }
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              id={id}
              className="pipeline-nodelist__row__checkbox"
              data-heap-event={
                kind === 'element'
                  ? `focusMode.checked.${checked}`
                  : `visible.${name}.${checked}`
              }
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
                  'pipeline-row__toggle-icon--focus-checked': focused,
                }
              )}
            />
          </label>
        )}
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
