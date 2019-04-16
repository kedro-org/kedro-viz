import React from 'react';
import { mount } from 'enzyme';
import NodeList, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, MockProvider } from '../../utils/data.mock';
import { getNodes } from '../../selectors/nodes';

const nodes = getNodes(mockState);

const setup = () =>
  mount(
    <MockProvider>
      <NodeList />
    </MockProvider>
  );

describe('FlowChart', () => {
  it('renders without crashing', () => {
    const wrapper = setup();
    const nodeList = wrapper.find('.pipeline-node');
    expect(nodeList.length).toBe(nodes.length);
  });

  it('filters the node list when entering search text', () => {
    const wrapper = setup();
    const testSearch = searchText => {
      const search = () => wrapper.find('.cbn-input__field');
      search().simulate('change', { target: { value: searchText } });
      const nodeList = wrapper.find('.pipeline-node');
      const expectedResult = nodes.filter(d => d.name.includes(searchText));
      expect(search().props().value).toBe(searchText);
      expect(nodeList.length).toBe(expectedResult.length);
    };
    testSearch(getNodes(mockState)[0].name);
    testSearch('a');
    testSearch('aaaaaaaaaaaaaaaaa');
    testSearch('');
  });

  it('clears the search filter input and resets the list when hitting the Escape key', () => {
    const wrapper = setup();
    const searchWrapper = wrapper.find('.pipeline-node-list-search');
    // Re-find elements from root each time to see updates
    const search = () => wrapper.find('.cbn-input__field');
    const nodeList = () => wrapper.find('.pipeline-node');
    const searchText = nodes[0].name;
    // Enter search text
    search().simulate('change', { target: { value: searchText } });
    // Check that search input value and node list have been updated
    expect(search().props().value).toBe(searchText);
    const expectedResult = nodes.filter(d => d.name.includes(searchText));
    expect(nodeList().length).toBe(expectedResult.length);
    // Clear the list with escape key
    searchWrapper.simulate('keydown', { keyCode: 27 });
    // Check that search input value and node list have been reset
    expect(search().props().value).toBe('');
    expect(nodeList().length).toBe(nodes.length);
  });

  it('toggles all nodes when clicking the check/uncheck all buttons', () => {
    const wrapper = setup();
    // Re-find elements from root each time to see updates
    const search = () => wrapper.find('.cbn-input__field');
    const inputProps = () =>
      wrapper.find('.cbn-switch__input').map(d => d.props());
    // Get search text value and filtered nodes
    const searchText = nodes[0].name;
    const expectedResult = nodes.filter(d => d.name.includes(searchText));
    // Enter search text
    search().simulate('change', { target: { value: searchText } });
    // Check that all search input value and node list have been updated
    expect(inputProps().every(d => d.checked === true)).toBe(true);
    // Uncheck all visible rows
    const uncheckAll = wrapper.find('.pipeline-node-list__toggle').at(1);
    uncheckAll.simulate('click');
    // All filtered rows should be shown
    expect(inputProps().length).toBe(expectedResult.length);
    // All visible rows should now be unchecked
    expect(inputProps().every(d => d.checked === false)).toBe(true);
    // Clear the search form so that all rows are now visible
    search().simulate('change', { target: { value: '' } });
    // All rows should now be visible
    expect(inputProps().length).toBe(nodes.length);
    // Not all rows should be checked
    expect(inputProps().every(d => d.checked === false)).toBe(false);
    // Previously-visible rows should now be unchecked
    expect(inputProps().filter(d => d.checked === false).length).toBe(
      expectedResult.length
    );
    // Previously-hidden rows should still be checked
    expect(inputProps().filter(d => d.checked === true).length).toBe(
      nodes.length - expectedResult.length
    );
    // Recheck all visible rows to show all again
    const checkAll = wrapper.find('.pipeline-node-list__toggle').at(0);
    checkAll.simulate('click');
    expect(inputProps().filter(d => d.checked === true).length).toBe(
      nodes.length
    );
  });

  it('maps state to props', () => {
    const expectedResult = {
      nodes: expect.arrayContaining([
        expect.objectContaining({
          active: expect.any(Boolean),
          disabled: expect.any(Boolean),
          disabled_node: expect.any(Boolean),
          disabled_tag: expect.any(Boolean),
          disabled_view: expect.any(Boolean),
          id: expect.any(String),
          name: expect.any(String),
          type: expect.any(String)
        })
      ]),
      theme: expect.stringMatching(/light|dark/)
    };
    expect(mapStateToProps(mockState)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch).onToggleNodeActive({ id: '123' }, true);
    expect(dispatch.mock.calls[0][0]).toEqual({
      nodeID: '123',
      isActive: true,
      type: 'TOGGLE_NODE_ACTIVE'
    });

    mapDispatchToProps(dispatch).onToggleNodeDisabled({ id: '456' }, false);
    expect(dispatch.mock.calls[1][0]).toEqual({
      nodeID: '456',
      isDisabled: false,
      type: 'TOGGLE_NODE_DISABLED'
    });

    const nodes = getNodes(mockState);
    mapDispatchToProps(dispatch).onToggleAllNodes(nodes, true);
    expect(dispatch.mock.calls[2][0]).toEqual({
      nodeIDs: nodes.map(d => d.id),
      isDisabled: true,
      type: 'TOGGLE_NODES_DISABLED'
    });
  });
});
