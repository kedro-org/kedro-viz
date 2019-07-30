import React from 'react';
import NodeList, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';
import { getNodes } from '../../selectors/nodes';

describe('NodeList', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<NodeList />);
    const search = wrapper.find('.pipeline-node-list-search');
    const nodeList = wrapper.find('.pipeline-node-list');
    expect(search.length).toBe(1);
    expect(nodeList.length).toBe(1);
  });

  describe('search filter', () => {
    const wrapper = setup.mount(<NodeList />);
    const searches = [
      getNodes(mockState)[0].name,
      'a',
      'aaaaaaaaaaaaaaaaa',
      ''
    ];

    test.each(searches)(
      'filters the node list when entering the search text "%s"',
      searchText => {
        const search = () => wrapper.find('.kui-input__field');
        search().simulate('change', { target: { value: searchText } });
        const nodeList = wrapper.find('.pipeline-node');
        const nodes = getNodes(mockState);
        const expectedResult = nodes.filter(node =>
          node.name.includes(searchText)
        );
        expect(search().props().value).toBe(searchText);
        expect(nodeList.length).toBe(expectedResult.length);
      }
    );

    it('clears the search filter input and resets the list when hitting the Escape key', () => {
      const wrapper = setup.mount(<NodeList />);
      const searchWrapper = wrapper.find('.pipeline-node-list-search');
      // Re-find elements from root each time to see updates
      const search = () => wrapper.find('.kui-input__field');
      const nodeList = () => wrapper.find('.pipeline-node');
      const nodes = getNodes(mockState);
      const searchText = nodes[0].name;
      // Enter search text
      search().simulate('change', { target: { value: searchText } });
      // Check that search input value and node list have been updated
      expect(search().props().value).toBe(searchText);
      const expectedResult = nodes.filter(node =>
        node.name.includes(searchText)
      );
      expect(nodeList().length).toBe(expectedResult.length);
      // Clear the list with escape key
      searchWrapper.simulate('keydown', { keyCode: 27 });
      // Check that search input value and node list have been reset
      expect(search().props().value).toBe('');
      expect(nodeList().length).toBe(nodes.length);
    });
  });

  describe('check/uncheck buttons', () => {
    const wrapper = setup.mount(<NodeList />);
    // Re-find elements from root each time to see updates
    const search = () => wrapper.find('.kui-input__field');
    const input = () => wrapper.find('.kui-switch__input');
    const inputProps = () => input().map(input => input.props());
    const toggleAllNodes = check =>
      wrapper
        .find('.pipeline-node-list__toggle')
        .at(check ? 0 : 1)
        .simulate('click');
    // Get search text value and filtered nodes
    const nodes = getNodes(mockState);
    const searchText = nodes[0].name;
    const expectedResult = nodes.filter(node => node.name.includes(searchText));

    it('disables every row when clicking uncheck all', () => {
      toggleAllNodes(false);
      expect(inputProps().every(input => input.checked === false)).toBe(true);
    });

    it('enables every row when clicking check all', () => {
      toggleAllNodes(false);
      toggleAllNodes(true);
      expect(inputProps().every(input => input.checked === true)).toBe(true);
    });

    describe('toggle only visible nodes when searching', () => {
      beforeAll(() => {
        // Reset node checked state
        toggleAllNodes(true);
        // Enter search text
        search().simulate('change', { target: { value: searchText } });
        // Disable visible nodes
        toggleAllNodes(false);
        // All visible rows should now be unchecked
        expect(inputProps().every(input => input.checked === false)).toBe(true);
        // Clear the search form so that all rows are now visible
        search().simulate('change', { target: { value: '' } });
      });

      test('All rows should now be visible', () => {
        expect(inputProps().length).toBe(nodes.length);
      });

      test('Not all rows should be checked', () => {
        expect(inputProps().every(input => input.checked === false)).toBe(
          false
        );
      });

      test('Not all rows should be unchecked', () => {
        expect(inputProps().every(input => input.checked === true)).toBe(false);
      });

      test('Previously-visible rows should now be unchecked', () => {
        expect(
          inputProps()
            .filter(input => input.checked === false)
            .map(input => input.name)
        ).toEqual(expectedResult.map(node => node.name));
      });

      test('Previously-hidden rows should still be checked', () => {
        expect(
          inputProps()
            .filter(input => input.checked === true)
            .map(input => input.name)
        ).toEqual(
          nodes
            .filter(node => !node.name.includes(searchText))
            .map(node => node.name)
        );
      });

      test('Toggling all the nodes back on checks all nodes', () => {
        toggleAllNodes(true);
        expect(
          inputProps()
            .filter(input => input.checked === true)
            .map(input => input.name)
        ).toEqual(nodes.map(node => node.name));
      });
    });

    afterAll(() => {
      wrapper.unmount();
    });
  });

  describe('node list', () => {
    it('renders the correct number of rows', () => {
      const wrapper = setup.mount(<NodeList />);
      const nodeList = wrapper.find('.pipeline-node');
      const nodes = getNodes(mockState);
      expect(nodeList.length).toBe(nodes.length);
    });
  });

  describe('node list item', () => {
    const wrapper = setup.mount(<NodeList />);
    const nodeRow = () => wrapper.find('.pipeline-node').first();

    it('handles mouseenter events', () => {
      nodeRow().simulate('mouseenter');
      expect(nodeRow().hasClass('pipeline-node--active')).toBe(true);
    });

    it('handles mouseleave events', () => {
      nodeRow().simulate('mouseleave');
      expect(nodeRow().hasClass('pipeline-node--active')).toBe(false);
    });
  });

  describe('node list item checkbox', () => {
    const wrapper = setup.mount(<NodeList />);
    const checkbox = () => wrapper.find('.kui-switch__input').first();

    it('handles toggle off event', () => {
      checkbox().simulate('change', { target: { checked: false } });
      expect(checkbox().props().checked).toBe(false);
    });

    it('handles toggle on event', () => {
      checkbox().simulate('change', { target: { checked: true } });
      expect(checkbox().props().checked).toBe(true);
    });
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
      nodeIDs: nodes.map(node => node.id),
      isDisabled: true,
      type: 'TOGGLE_NODES_DISABLED'
    });
  });
});
