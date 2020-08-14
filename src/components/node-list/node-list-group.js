import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import NodeListRow from './node-list-row';
import { toggleTypeDisabled } from '../../actions/node-type';

export const NodeListGroup = ({
  children,
  collapsed,
  onToggleTypeDisabled,
  onToggleCollapsed,
  type,
  childCount,
  allChecked
}) => (
  <li
    className={classnames(
      'pipeline-nodelist__item',
      `pipeline-nodelist__item--${type.name.toLowerCase()}`,
      {
        'pipeline-nodelist__item--all-checked': allChecked
      }
    )}>
    <h3 className="pipeline-nodelist__heading">
      <NodeListRow
        checked={!type.disabled}
        id={type.id}
        label={`${type.name} <i>${childCount}</i>`}
        name={type.name}
        onChange={e => {
          onToggleTypeDisabled(type.id, !e.target.checked);
        }}>
        <button
          aria-label={`${
            collapsed ? 'Show' : 'Hide'
          } ${type.name.toLowerCase()}`}
          onClick={() => onToggleCollapsed(type.id)}
          className={classnames('pipeline-type-group-toggle', {
            'pipeline-type-group-toggle--alt': collapsed
          })}
        />
      </NodeListRow>
    </h3>

    <div
      className={classnames({
        'pipeline-nodelist__children': true,
        'pipeline-nodelist__children--open': !collapsed,
        'pipeline-nodelist__children--closed': collapsed
      })}>
      {children}
    </div>
  </li>
);

export const mapDispatchToProps = (dispatch, props) => ({
  onToggleTypeDisabled:
    props.onToggleTypeDisabled ||
    ((typeID, disabled) => {
      dispatch(toggleTypeDisabled(typeID, disabled));
    })
});

export default connect(
  null,
  mapDispatchToProps
)(NodeListGroup);
