import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { Flipped } from 'react-flip-toolkit';
import NodeListItem from './node-list-item';
import { toggleTypeDisabled } from '../../actions/node-type';

export const NodeListGroup = ({
  children,
  onToggleTypeDisabled,
  onToggleCollapsed,
  theme,
  type,
  collapsed
}) => (
  <Flipped flipId={type.id}>
    <li>
      <Flipped inverseFlipId={type.id} scale>
        <div>
          <h3 className="pipeline-nodelist__heading">
            <NodeListItem
              active={null}
              checked={!type.disabled}
              disabled={null}
              label={type.name}
              name={type.name}
              onMouseEnter={null}
              onMouseLeave={null}
              onChange={(e, { checked }) => {
                onToggleTypeDisabled(type.id, !checked);
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
            </NodeListItem>
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

export const mapStateToProps = state => ({
  theme: state.theme
});

export const mapDispatchToProps = dispatch => ({
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeListGroup);
