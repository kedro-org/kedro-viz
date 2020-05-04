import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { Flipped } from 'react-flip-toolkit';
import NodeListRow from './node-list-row';
import { toggleTypeDisabled } from '../../actions/node-type';

export const NodeListGroup = ({
  children,
  onToggleTypeDisabled,
  onToggleCollapsed,
  type,
  collapsed
}) => (
  <Flipped flipId={type.id}>
    <li>
      <Flipped inverseFlipId={type.id} scale>
        <div>
          <h3 className="pipeline-nodelist__heading">
            <NodeListRow
              checked={!type.disabled}
              id={type.id}
              label={type.name}
              name={type.name}
              onChange={e => {
                onToggleTypeDisabled(type.id, !e.target.checked);
              }}
              type={type.id}>
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
          <Flipped
            flipId={`${type.id}-children`}
            onAppear={el => {
              el.classList.add('pipeline-nodelist--fade-in');
              el.onanimationend = () => {
                el.style.opacity = 1;
                el.classList.remove('pipeline-nodelist--fade-in');
              };
            }}
            onExit={(el, i, removeElement) => {
              el.style.opacity = 0;
              el.classList.add('pipeline-nodelist--fade-out');
              el.onanimationend = removeElement;
            }}
            opacity>
            {collapsed ? null : children}
          </Flipped>
        </div>
      </Flipped>
    </li>
  </Flipped>
);

export const mapDispatchToProps = dispatch => ({
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  }
});

export default connect(
  null,
  mapDispatchToProps
)(NodeListGroup);
