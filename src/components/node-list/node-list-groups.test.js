import React from 'react';
import NodeListGroups from './node-list-groups';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeTypes } from '../../selectors/node-types';
import { getGroupedNodes } from '../../selectors/nodes';
import { getGroups, getSections } from './node-list-items';

describe('NodeListGroups', () => {
  const mockProps = () => {
    const items = getGroupedNodes(mockState.animals);
    const types = getNodeTypes(mockState.animals);
    const sections = getSections({ flags: { modularpipeline: true } });
    const groups = getGroups({ types, items });
    return { items, sections, groups };
  };

  it('renders without throwing', () => {
    expect(() =>
      setup.mount(<NodeListGroups {...mockProps()} />)
    ).not.toThrow();
  });

  it('handles collapse button click events', () => {
    const wrapper = setup.mount(<NodeListGroups {...mockProps()} />);
    const nodeList = () =>
      wrapper.find('.pipeline-nodelist__list--nested').first();
    const toggle = () => wrapper.find('.pipeline-type-group-toggle').first();
    expect(nodeList().length).toBe(1);
    expect(toggle().hasClass('pipeline-type-group-toggle--alt')).toBe(false);
    toggle().simulate('click');
    expect(nodeList().length).toBe(1);
    expect(toggle().hasClass('pipeline-type-group-toggle--alt')).toBe(true);
  });

  it('handles group checkbox change events', () => {
    const onToggleGroupChecked = jest.fn();
    const wrapper = setup.mount(
      <NodeListGroups
        {...mockProps()}
        onToggleGroupChecked={onToggleGroupChecked}
      />
    );
    const checkbox = () => wrapper.find('input').first();
    checkbox().simulate('change', { target: { checked: false } });
    expect(onToggleGroupChecked.mock.calls.length).toEqual(1);
  });
});
