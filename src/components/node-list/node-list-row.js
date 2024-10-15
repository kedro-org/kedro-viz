import React, { memo } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { changed, replaceAngleBracketMatches } from '../../utils';
import NodeIcon from '../icons/node-icon';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import FocusModeIcon from '../icons/focus-mode';
import { getNodeActive } from '../../selectors/nodes';
import { toggleHoveredFocusMode } from '../../actions';
import { NodeListRowToggle } from '../node-list-row-toggle/node-list-row-toggle';

// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 32;

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
      'highlight',
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
    highlight,
    isSlicingPipelineApplied,
    type,
    icon,
    visibleIcon = VisibleIcon,
    invisibleIcon = InvisibleIcon,
    focusModeIcon = FocusModeIcon,
    rowType,
    onToggleHoveredFocusMode,
  }) => {
    const isModularPipeline = type === 'modularPipeline';
    const FocusIcon = isModularPipeline ? focusModeIcon : null;
    const isChecked = isModularPipeline ? checked || focused : checked;
    const VisibilityIcon = isChecked ? visibleIcon : invisibleIcon;
    const isButton = onClick && kind !== 'filter';
    const TextButton = isButton ? 'button' : 'div';

    return (
      <Container
        className={classnames(
          'node-list-row kedro',
          `node-list-row--kind-${kind}`,
          {
            'node-list-row--visible': visible,
            'node-list-row--active': active,
            'node-list-row--selected':
              selected || (!isSlicingPipelineApplied && highlight),
            'node-list-row--disabled': disabled,
            'node-list-row--unchecked': !isChecked,
            'node-list-row--overwrite': !(active || selected),
          }
        )}
        title={name}
        onMouseEnter={visible ? onMouseEnter : null}
        onMouseLeave={visible ? onMouseLeave : null}
      >
        {icon && (
          <NodeIcon
            className={classnames(
              'node-list-row__type-icon',
              'node-list-row__icon',
              {
                'node-list-row__type-icon--faded': faded,
                'node-list-row__type-icon--disabled': disabled,
                'node-list-row__type-icon--nested': !children,
                'node-list-row__type-icon--active': active,
                'node-list-row__type-icon--selected': selected,
              }
            )}
            icon={icon}
          />
        )}
        <TextButton
          className={classnames(
            'node-list-row__text',
            `node-list-row__text--kind-${kind}`,
            `node-list-row__text--${rowType}`
          )}
          data-test={`nodelist-${icon}-${children ? null : name}`}
          onClick={onClick}
          onFocus={onMouseEnter}
          onBlur={onMouseLeave}
          title={children ? null : name}
        >
          <span
            className={classnames(
              'node-list-row__label',
              `node-list-row__label--kind-${kind}`,
              {
                'node-list-row__label--faded': faded,
                'node-list-row__label--disabled': disabled,
              }
            )}
            dangerouslySetInnerHTML={{
              __html: replaceAngleBracketMatches(label),
            }}
          />
        </TextButton>
        {typeof count === 'number' && (
          <span onClick={onClick} className={'node-list-row__count'}>
            {count}
          </span>
        )}
        {VisibilityIcon && (
          <NodeListRowToggle 
            allUnchecked={allUnchecked}
            isParent={Boolean(children)}
            disabled={disabled}
            focusChecked={isModularPipeline ? false : focused}
            IconComponent={VisibilityIcon}
            id={id}
            isChecked={isChecked}
            kind={kind}
            name={name}
            onChange={onChange}
            onToggleHoveredFocusMode={onToggleHoveredFocusMode}
            selected={selected}
          />
        )}
        {FocusIcon && (
          <NodeListRowToggle 
            allUnchecked={allUnchecked}
            isParent={Boolean(children)}
            disabled={disabled}
            focusChecked={focused}
            IconComponent={FocusIcon}
            id={id}
            isChecked={isChecked}
            kind={kind}
            name={name}
            onChange={onChange}
            onToggleHoveredFocusMode={onToggleHoveredFocusMode}
            selected={selected}
          />
        )}
        {children}
      </Container>
    );
  },
  shouldMemo
);

export const mapDispatchToProps = (dispatch) => ({
  onToggleHoveredFocusMode: (active) => {
    dispatch(toggleHoveredFocusMode(active));
  },
});

export const mapStateToProps = (state, ownProps) => ({
  ...ownProps,
  active:
    typeof ownProps.active !== 'undefined'
      ? ownProps.active
      : getNodeActive(state)[ownProps.id] || false,
});

export default connect(mapStateToProps, mapDispatchToProps)(NodeListRow);
