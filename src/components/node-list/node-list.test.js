import React from 'react';
import NodeList, { mapStateToProps } from './index';
import SplitPanel from '../split-panel';
import { mockState, setup } from '../../utils/state.mock';
import { getNodeData } from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import IndicatorPartialIcon from '../icons/indicator-partial';
import { localStorageName } from '../../config';
import { toggleTypeDisabled } from '../../actions/node-type';

describe('NodeList', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders without crashing', () => {
    const wrapper = setup.mount(<NodeList />);
    const search = wrapper.find('.pipeline-nodelist-search');
    const nodeList = wrapper.find('.pipeline-nodelist__list');
    expect(search.length).toBe(1);
    expect(nodeList.length).toBeGreaterThan(0);
  });

  describe('search filter', () => {
    const wrapper = setup.mount(<NodeList />);
    const searches = [
      getNodeData(mockState.animals)[0].name,
      'a',
      'aaaaaaaaaaaaaaaaa',
      '',
    ];

    test.each(searches)(
      'filters the node list when entering the search text "%s"',
      (searchText) => {
        const search = () => wrapper.find('.kui-input__field');
        search().simulate('change', { target: { value: searchText } });
        const nodeList = wrapper.find(
          '.pipeline-nodelist__list--nested .pipeline-nodelist__row'
        );
        const nodes = getNodeData(mockState.animals);
        const tags = getTagData(mockState.animals);
        const expectedResult = nodes.filter((node) =>
          node.name.includes(searchText)
        );
        const expectedTagResult = tags.filter((tag) =>
          tag.name.includes(searchText)
        );
        expect(search().props().value).toBe(searchText);
        expect(nodeList.length).toBe(
          expectedResult.length + expectedTagResult.length
        );
      }
    );

    it('clears the search filter input and resets the list when hitting the Escape key', () => {
      const wrapper = setup.mount(<NodeList />);
      const searchWrapper = wrapper.find('.pipeline-nodelist-search');
      // Re-find elements from root each time to see updates
      const search = () => wrapper.find('.kui-input__field');
      const nodeList = () =>
        wrapper.find(
          '.pipeline-nodelist__list--nested .pipeline-nodelist__row'
        );
      const nodes = getNodeData(mockState.animals);
      const tags = getTagData(mockState.animals);
      const searchText = nodes[0].name;
      // Enter search text
      search().simulate('change', { target: { value: searchText } });
      // Check that search input value and node list have been updated
      expect(search().props().value).toBe(searchText);
      const expectedResult = nodes.filter((node) =>
        node.name.includes(searchText)
      );
      const expectedTagResult = tags.filter((tag) =>
        tag.name.includes(searchText)
      );
      expect(nodeList().length).toBe(
        expectedResult.length + expectedTagResult.length
      );
      // Clear the list with escape key
      searchWrapper.simulate('keydown', { keyCode: 27 });
      // Check that search input value and node list have been reset
      expect(search().props().value).toBe('');
      expect(nodeList().length).toBe(nodes.length + tags.length);
    });
  });

  describe('visibility checkboxes on element items', () => {
    //Parameters are enabled here to override the default behavior
    const wrapper = setup.mount(<NodeList />, {
      beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
    });

    afterEach(() => {
      toggleTypeDisabled('parameters', true);
    });
    // Re-find elements from root each time to see updates
    const search = () => wrapper.find('.kui-input__field');
    const rows = () =>
      wrapper
        .find(
          '.pipeline-nodelist__group--kind-element .pipeline-nodelist__list--nested'
        )
        .find('.pipeline-nodelist__row');
    const rowName = (row) =>
      row.find('.pipeline-nodelist__row__text').prop('title');
    const isRowEnabled = (row) =>
      row.hasClass('pipeline-nodelist__row--visible');
    const setShownRowsEnabled = (enable) =>
      rows().forEach((row) =>
        row
          .find('.pipeline-nodelist__row__checkbox')
          .simulate('change', { target: { checked: enable } })
      );
    // Get search text value and filtered nodes
    const nodes = getNodeData(mockState.animals);
    const searchText = nodes[0].name;
    const expectedResult = nodes.filter((node) =>
      node.name.includes(searchText)
    );

    describe('toggle only visible rows when searching', () => {
      beforeAll(() => {
        // Reset node checked state
        setShownRowsEnabled(true);
        // Enter search text
        search().simulate('change', { target: { value: searchText } });
        // Disable the found rows
        setShownRowsEnabled(false);
        // All visible rows should now be disabled
        expect(rows().everyWhere((row) => !isRowEnabled(row))).toBe(true);
        // Clear the search form so that all rows are now visible
        search().simulate('change', { target: { value: '' } });
      });

      test('All rows should now be shown', () => {
        expect(rows().length).toBe(nodes.length);
      });

      test('Some rows should not be enabled', () => {
        expect(rows().someWhere((row) => !isRowEnabled(row))).toBe(true);
      });

      test('Some rows should be enabled', () => {
        expect(rows().someWhere((row) => isRowEnabled(row))).toBe(true);
      });

      test('Previously-visible rows should now be not enabled', () => {
        expect(
          rows()
            .filterWhere((row) => !isRowEnabled(row))
            .map((row) => rowName(row))
            .sort()
        ).toEqual(expectedResult.map((node) => node.name).sort());
      });

      test('Previously-hidden rows should still be enabled', () => {
        expect(
          rows()
            .filterWhere((row) => isRowEnabled(row))
            .map((row) => rowName(row))
            .sort()
        ).toEqual(
          nodes
            .filter((node) => !node.name.includes(searchText))
            .map((node) => node.name)
            .sort()
        );
      });

      test('Toggling all the nodes back on enables all nodes', () => {
        setShownRowsEnabled(true);
        expect(
          rows()
            .filterWhere((row) => isRowEnabled(row))
            .map((row) => rowName(row))
            .sort()
        ).toEqual(nodes.map((node) => node.name).sort());
      });
    });

    afterAll(() => {
      wrapper.unmount();
    });
  });

  describe('checkboxes on tag filter items', () => {
    const checkboxByName = (wrapper, text) =>
      wrapper.find(`.pipeline-nodelist__row__checkbox[name="${text}"]`);

    const rowByName = (wrapper, text) =>
      wrapper.find(`.pipeline-nodelist__row[title="${text}"]`);

    const changeRows = (wrapper, names, checked) =>
      names.forEach((name) =>
        checkboxByName(wrapper, name).simulate('change', {
          target: { checked },
        })
      );

    const elements = (wrapper) =>
      wrapper
        .find(
          '.pipeline-nodelist__group--kind-element .pipeline-nodelist__list--nested'
        )
        .find('.pipeline-nodelist__row')
        .map((row) => [
          row.prop('title'),
          !row.hasClass('pipeline-nodelist__row--disabled'),
        ]);

    const elementsEnabled = (wrapper) =>
      elements(wrapper).filter(([_, enabled]) => enabled);

    const tagItem = (wrapper) =>
      wrapper.find('.pipeline-nodelist__group--type-tag');

    const partialIcon = (wrapper) =>
      tagItem(wrapper).find(IndicatorPartialIcon);

    it('selecting tags enables only elements with given tags', () => {
      //Parameters are enabled here to override the default behavior
      const wrapper = setup.mount(<NodeList />, {
        beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      });

      changeRows(wrapper, ['Small'], true);
      expect(elementsEnabled(wrapper)).toEqual([
        ['salmon', true],
        ['Bull', true],
        ['Cat', true],
        ['Dog', true],
        ['Horse', true],
        ['Sheep', true],
        ['Parameters', true],
        ['Params:rabbit', true],
      ]);

      changeRows(wrapper, ['Small', 'Large'], true);
      expect(elementsEnabled(wrapper)).toEqual([
        ['salmon', true],
        ['shark', true],
        ['Bear', true],
        ['Bull', true],
        ['Cat', true],
        ['Dog', true],
        ['Elephant', true],
        ['Giraffe', true],
        ['Horse', true],
        ['Nested.weasel', true],
        ['Pig', true],
        ['Sheep', true],
        ['Parameters', true],
        ['Params:rabbit', true],
      ]);
    });

    it('selecting a tag sorts elements by enabled first then alphabetical', () => {
      //Parameters are enabled here to override the default behavior
      const wrapper = setup.mount(<NodeList />, {
        beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      });

      changeRows(wrapper, ['Medium'], true);
      expect(elements(wrapper)).toEqual([
        // Tasks (enabled)
        ['shark', true],
        // Tasks (disabled)
        ['salmon', false],
        ['trout', false],
        ['tuna', false],
        // Datasets (enabled)
        ['Bear', true],
        ['Cat', true],
        ['Elephant', true],
        ['Giraffe', true],
        ['Nested.weasel', true],
        ['Pig', true],
        // Datasets (disabled)
        ['Bull', false],
        ['Dog', false],
        ['Horse', false],
        ['Pipeline1.data Science.dolphin', false],
        ['Pipeline1.data Science.sheep', false],
        ['Pipeline2.data Science.pig', false],
        ['Pipeline2.data Science.sheep', false],
        ['Pipeline2.data Science.whale', false],
        ['Sheep', false],
        // Parameters
        ['Parameters', false],
        ['Params:pipeline100.data Science.plankton', false],
        ['Params:pipeline2.data Science.plankton', false],
        ['Params:rabbit', false],
      ]);
    });

    it('adds a class to tag group item when all tags unset', () => {
      const wrapper = setup.mount(<NodeList />);
      const unsetClass = 'pipeline-nodelist__group--all-unset';

      expect(tagItem(wrapper).hasClass(unsetClass)).toBe(true);
      changeRows(wrapper, ['Large'], true);
      expect(tagItem(wrapper).hasClass(unsetClass)).toBe(false);
      changeRows(wrapper, ['Large'], false);
      expect(tagItem(wrapper).hasClass(unsetClass)).toBe(true);
    });

    it('adds a class to the row when a tag row unchecked', () => {
      const wrapper = setup.mount(<NodeList />);
      const uncheckedClass = 'pipeline-nodelist__row--unchecked';

      expect(rowByName(wrapper, 'Large').hasClass(uncheckedClass)).toBe(true);
      changeRows(wrapper, ['Large'], true);
      expect(rowByName(wrapper, 'Large').hasClass(uncheckedClass)).toBe(false);
      changeRows(wrapper, ['Large'], false);
      expect(rowByName(wrapper, 'Large').hasClass(uncheckedClass)).toBe(true);
    });

    it('shows as partially selected when at least one but not all tags selected', () => {
      const wrapper = setup.mount(<NodeList />);

      // No tags selected
      expect(partialIcon(wrapper)).toHaveLength(0);

      // Some tags selected
      changeRows(wrapper, ['Large'], true);
      expect(partialIcon(wrapper)).toHaveLength(1);

      // All tags selected
      changeRows(wrapper, ['Medium', 'Small'], true);
      expect(partialIcon(wrapper)).toHaveLength(0);
    });

    it('saves enabled tags in localStorage on selecting a tag on node-list', () => {
      const wrapper = setup.mount(<NodeList />);
      changeRows(wrapper, ['Medium'], true);
      const localStoredValues = JSON.parse(
        window.localStorage.getItem(localStorageName)
      );
      expect(localStoredValues.tag.enabled.medium).toEqual(true);
    });
  });

  describe('node list', () => {
    it('renders the correct number of rows', () => {
      const wrapper = setup.mount(<NodeList />);
      const nodeList = wrapper.find(
        '.pipeline-nodelist__list--nested .pipeline-nodelist__row'
      );
      const nodes = getNodeData(mockState.animals);
      const tags = getTagData(mockState.animals);
      expect(nodeList.length).toBe(nodes.length + tags.length);
    });

    it('renders elements panel, filter panel inside a SplitPanel with a handle', () => {
      const wrapper = setup.mount(<NodeList />);
      const split = wrapper.find(SplitPanel);

      expect(split.find('.pipeline-nodelist__split').exists()).toBe(true);

      expect(split.find('.pipeline-nodelist__elements-panel').exists()).toBe(
        true
      );

      expect(split.find('.pipeline-nodelist__filter-panel').exists()).toBe(
        true
      );

      expect(split.find('.pipeline-nodelist__split-handle').exists()).toBe(
        true
      );
    });
  });

  describe('node list element item', () => {
    const wrapper = setup.mount(<NodeList />);
    const nodeRow = () =>
      wrapper
        .find(
          '.pipeline-nodelist__group--type-task .pipeline-nodelist__list--nested .pipeline-nodelist__row'
        )
        .first();

    it('handles mouseenter events', () => {
      nodeRow().simulate('mouseenter');
      expect(nodeRow().hasClass('pipeline-nodelist__row--active')).toBe(true);
    });

    it('handles mouseleave events', () => {
      nodeRow().simulate('mouseleave');
      expect(nodeRow().hasClass('pipeline-nodelist__row--active')).toBe(false);
    });
  });

  describe('node list element item checkbox', () => {
    const wrapper = setup.mount(<NodeList />);
    const checkbox = () =>
      wrapper
        .find(
          '.pipeline-nodelist__group--type-task .pipeline-nodelist__list--nested .pipeline-nodelist__row input'
        )
        .first();

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
    const nodeList = expect.arrayContaining([
      expect.objectContaining({
        disabled: expect.any(Boolean),
        disabled_node: expect.any(Boolean),
        disabled_tag: expect.any(Boolean),
        disabled_type: expect.any(Boolean),
        disabled_modularPipeline: expect.any(Boolean),
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
      }),
    ]);
    const expectedResult = expect.objectContaining({
      tags: expect.any(Object),
      nodes: expect.objectContaining({
        data: nodeList,
        task: nodeList,
      }),
      nodeSelected: expect.any(Object),
      types: expect.any(Array),
      modularPipelines: expect.any(Object),
      sections: expect.any(Object),
    });
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });
});
