import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { Flipped } from 'react-flip-toolkit';
import Checkbox from '@quantumblack/kedro-ui/lib/components/checkbox';
import { toggleTypeDisabled } from '../../actions';

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
          <h3 className="pipeline-node pipeline-node--heading">
            <Checkbox
              checked={!type.disabled}
              label={type.name}
              name={type.name}
              onChange={(e, { checked }) => {
                onToggleTypeDisabled(type.id, !checked);
              }}
              theme={theme}
            />
            <button
              aria-label={`${
                collapsed ? 'Show' : 'Hide'
              } ${type.name.toLowerCase()}`}
              onClick={() => onToggleCollapsed(type.id)}
              className={classnames('pipeline-type-group-toggle', {
                'pipeline-type-group-toggle--alt': collapsed
              })}>
              ▾
            </button>
          </h3>
          <Flipped
            flipId={`${type.id}-children`}
            onAppear={el => {
              el.classList.add('pipeline-node-list--fade-in');
              el.onanimationend = () => {
                el.style.opacity = 1;
                el.classList.remove('pipeline-node-list--fade-in');
              };
            }}
            onExit={(el, i, removeElement) => {
              el.style.opacity = 0;
              el.classList.add('pipeline-node-list--fade-out');
              el.onanimationend = removeElement;
            }}
            opacity>
            {collapsed ? null : (
              <ul className="pipeline-node-list pipeline-node-list--nested">
                {children}
              </ul>
            )}
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
