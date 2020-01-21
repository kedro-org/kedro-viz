import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import Checkbox from '@quantumblack/kedro-ui/lib/components/checkbox';
import { toggleTypeActive, toggleTypeDisabled } from '../../actions';

const NodeListGroup = ({
  children,
  onToggleTypeActive,
  onToggleTypeDisabled,
  onToggleTypeGroupCollapsed,
  theme,
  type,
  typeGroupCollapsed
}) => (
  <li>
    <h3
      onMouseEnter={() => onToggleTypeActive(type.id, true)}
      onMouseLeave={() => onToggleTypeActive(type.id, false)}
      className={classnames('pipeline-node', {
        'pipeline-node--active': type.active
      })}>
      <button
        onClick={() => onToggleTypeGroupCollapsed(type.id)}
        className={classnames('pipeline-type-group-toggle', {
          'pipeline-type-group-toggle--alt': typeGroupCollapsed[type.id]
        })}>
        ▾
      </button>
      <Checkbox
        checked={!type.disabled}
        label={type.name}
        name={type.name}
        onChange={(e, { checked }) => {
          onToggleTypeDisabled(type.id, !checked);
        }}
        theme={theme}
      />
    </h3>
    <ul
      className={classnames('pipeline-node-list pipeline-node-list--nest1', {
        'pipeline-node-list--collapsed': typeGroupCollapsed[type.id]
      })}>
      {children}
    </ul>
  </li>
);

export const mapStateToProps = state => ({
  theme: state.theme
});

export const mapDispatchToProps = dispatch => ({
  onToggleTypeActive: (typeID, active) => {
    dispatch(toggleTypeActive(typeID, active));
  },
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeListGroup);
