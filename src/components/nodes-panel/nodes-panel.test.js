import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { toggleIsPrettyName } from '../../actions';
import { toggleTypeDisabled } from '../../actions/node-type';
import { localStorageName, sidebarElementTypes } from '../../config';
import {
  getNodeData,
  getNodeModularPipelines,
  getModularPipelinesTree,
} from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import { mockState, setup } from '../../utils/state.mock';
import IndicatorPartialIcon from '../icons/indicator-partial';
import SplitPanel from '../split-panel';
import NodesPanel from './index';

jest.mock('lodash/debounce', () => (func) => {
  func.cancel = jest.fn();
  return func;
});

describe('NodesPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders without crashing', () => {
    const wrapper = setup.mount(
      <MemoryRouter>
        <NodesPanel />
      </MemoryRouter>
    );
    const search = wrapper.find('.pipeline-search-list');
    const nodeList = wrapper.find('.filters__section-wrapper');
    expect(search.length).toBe(1);
    expect(nodeList.length).toBeGreaterThan(0);
  });

  describe('tree-search-ui', () => {
    describe('displays nodes matching search value', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );

      const searches = [
        // search text that matches an external node only
        'metrics',
        // search text that matches a few nodes nested inside modular pipelines
        'preprocess',
        // bogus search text that should yield 0 result
        'aaaaaaaaaaaaa',
      ];

      test.each(searches)(
        'display only the nodes matching the search text "%s", as well as their modular pipelines',
        (searchText) => {
          const search = () => wrapper.find('.search-input__field');
          search().simulate('change', { target: { value: searchText } });
          const nodeList = wrapper.find(
            '.pipeline-nodelist__elements-panel .node-list-tree-item-row'
          );
          const nodes = getNodeData(mockState.spaceflights);
          const tags = getTagData(mockState.spaceflights);
          const nodesModularPipelines = getNodeModularPipelines(
            mockState.spaceflights
          );
          const expectedResult = nodes.filter((node) =>
            node.name.toLowerCase().includes(searchText)
          );
          const expectedTagResult = tags.filter((tag) =>
            tag.name.toLowerCase().includes(searchText)
          );
          const expectedElementTypeResult = Object.keys(
            sidebarElementTypes
          ).filter((type) => type.toLowerCase().includes(searchText));
          const expectedModularPipelines = nodesModularPipelines.hasOwnProperty(
            searchText
          )
            ? nodesModularPipelines[searchText]
            : [];

          expect(search().props().value).toBe(searchText);
          expect(nodeList.length).toBe(
            expectedResult.length +
              expectedTagResult.length +
              expectedElementTypeResult.length +
              expectedModularPipelines.length
          );
        }
      );
    });
    it('clears the search input and resets the list when hitting the Escape key', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );
      const searchWrapper = wrapper.find('.pipeline-search-list');
      // Re-find elements from root each time to see updates
      const search = () => wrapper.find('.search-input__field');
      const nodeList = () =>
        wrapper.find(
          '.pipeline-nodelist__elements-panel .node-list-tree-item-row'
        );

      const nodes = getNodeData(mockState.spaceflights);
      const tags = getTagData(mockState.spaceflights);
      const elementTypes = Object.keys(sidebarElementTypes);
      const searchText = 'metrics';
      search().simulate('change', { target: { value: searchText } });
      // Check that search input value and node list have been updated
      expect(search().props().value).toBe(searchText);
      const expectedResult = nodes.filter((node) =>
        node.name.includes(searchText)
      );
      const expectedTagResult = tags.filter((tag) =>
        tag.name.includes(searchText)
      );
      const expectedElementTypeResult = elementTypes.filter((type) =>
        type.includes(searchText)
      );
      expect(nodeList().length).toBe(
        expectedResult.length +
          expectedTagResult.length +
          expectedElementTypeResult.length
      );
      // Clear the list with escape key
      searchWrapper.simulate('keydown', { keyCode: 27 });

      // Check that search input value and node list have been reset
      const modularPipelinesTree = getModularPipelinesTree(
        mockState.spaceflights
      );
      expect(search().props().value).toBe('');
      expect(nodeList().length).toBe(
        modularPipelinesTree['__root__'].children.length
      );
    });
    it('displays search results when in focus mode', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel focusMode={{ id: 'data_science' }} />
        </MemoryRouter>
      );
      const searchWrapper = wrapper.find('.pipeline-search-list');
      // Re-find elements from root each time to see updates
      const search = () => wrapper.find('.search-input__field');
      const nodeList = () =>
        wrapper.find(
          '.pipeline-nodelist__elements-panel .node-list-tree-item-row'
        );

      const nodes = getNodeData(mockState.spaceflights);
      const tags = getTagData(mockState.spaceflights);
      const elementTypes = Object.keys(sidebarElementTypes);
      const searchText = 'metrics';
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
      const expectedElementTypeResult = elementTypes.filter((type) =>
        type.includes(searchText)
      );
      expect(nodeList().length).toBe(
        expectedResult.length +
          expectedTagResult.length +
          expectedElementTypeResult.length
      );
      // Clear the list with escape key
      searchWrapper.simulate('keydown', { keyCode: 27 });

      // Check that search input value and node list have been reset
      const modularPipelinesTree = getModularPipelinesTree(
        mockState.spaceflights
      );
      expect(search().props().value).toBe('');
      expect(nodeList().length).toBe(
        modularPipelinesTree['__root__'].children.length
      );
    });
  });

  describe('Pretty names in node list', () => {
    const elements = (wrapper) =>
      wrapper
        .find('.MuiTreeItem-label')
        .find('.node-list-tree-item-row')
        .map((row) => [row.prop('title')]);

    it('shows full node names when pretty name is turned off', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>,
        {
          beforeLayoutActions: [() => toggleIsPrettyName(false)],
        }
      );
      expect(elements(wrapper)).toEqual([
        ['data_processing'],
        ['data_science'],
        ['metrics'],
        ['model_input_table'],
        ['parameters'],
      ]);
    });
    it('shows formatted node names when pretty name is turned on', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>,
        {
          beforeLayoutActions: [() => toggleIsPrettyName(true)],
        }
      );
      expect(elements(wrapper)).toEqual([
        ['Data Processing'],
        ['Data Science'],
        ['Metrics'],
        ['Model Input Table'],
        ['Parameters'],
      ]);
    });
  });

  describe('checkboxes on tag filter items', () => {
    const checkboxByName = (wrapper, text) =>
      wrapper.find(`.toggle-control__checkbox[name="${text}"]`);

    const filterRowByName = (wrapper, text) =>
      wrapper.find(`.node-list-filter-row[title="${text}"]`);

    const changeRows = (wrapper, names, checked) =>
      names.forEach((name) =>
        checkboxByName(wrapper, name).simulate('change', {
          target: { checked },
        })
      );

    const elements = (wrapper) =>
      wrapper
        .find('.MuiTreeItem-label')
        .find('.node-list-tree-item-row')
        .map((row) => [row.prop('title'), !row.hasClass('row--disabled')]);

    const tagItem = (wrapper) => wrapper.find('.filters-section--type-tag');

    const partialIcon = (wrapper) =>
      tagItem(wrapper).find(IndicatorPartialIcon);

    it('selecting a tag sorts elements by modular pipelines first then by task, data and parameter nodes ', () => {
      //Parameters are enabled here to override the default behavior
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>,
        {
          beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
        }
      );

      // with the modular pipeline tree structure the elements displayed here are for the top level pipeline
      expect(elements(wrapper)).toEqual([
        ['data_processing', true],
        ['data_science', true],
        ['metrics', true],
        ['model_input_table', true],
        ['parameters', true],
      ]);
    });

    it('adds a class to tag group item when all tags unchecked', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );
      const uncheckedClass = 'filters-section--all-unchecked';

      expect(tagItem(wrapper).hasClass(uncheckedClass)).toBe(true);
      changeRows(wrapper, ['Preprocessing'], true);
      expect(tagItem(wrapper).hasClass(uncheckedClass)).toBe(false);
      changeRows(wrapper, ['Preprocessing'], false);
      expect(tagItem(wrapper).hasClass(uncheckedClass)).toBe(true);
    });

    it('adds a class to the row when a tag row unchecked', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );
      const uncheckedClass = 'toggle-control--icon--unchecked';

      const filterRow = filterRowByName(wrapper, 'Preprocessing');
      const hasUncheckedClass = filterRow.find(`.${uncheckedClass}`).exists();
      expect(hasUncheckedClass).toBe(true);

      changeRows(wrapper, ['Preprocessing'], true);
      const hasUncheckedClassAfterChangeTrue = filterRowByName(
        wrapper,
        'Preprocessing'
      )
        .find(`.${uncheckedClass}`)
        .exists();
      expect(hasUncheckedClassAfterChangeTrue).toBe(false);

      changeRows(wrapper, ['Preprocessing'], false);
      const hasUncheckedClassAfterChangeFalse = filterRowByName(
        wrapper,
        'Preprocessing'
      )
        .find(`.${uncheckedClass}`)
        .exists();
      expect(hasUncheckedClassAfterChangeFalse).toBe(true);
    });

    it('shows as partially selected when at least one but not all tags selected', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );

      // No tags selected
      expect(partialIcon(wrapper)).toHaveLength(0);

      // Some tags selected
      changeRows(wrapper, ['Preprocessing'], true);
      expect(partialIcon(wrapper)).toHaveLength(1);

      // All tags selected
      changeRows(
        wrapper,
        ['Features', 'Preprocessing', 'Split', 'Train'],
        true
      );
      expect(partialIcon(wrapper)).toHaveLength(1);
    });

    it('saves enabled tags in localStorage on selecting a tag on node-list', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );
      changeRows(wrapper, ['Preprocessing'], true);
      const localStoredValues = JSON.parse(
        window.localStorage.getItem(localStorageName)
      );
      expect(localStoredValues.tag.enabled.preprocessing).toEqual(true);
    });
  });

  // FILTER GROUP
  describe('node list', () => {
    it('renders the correct number of tags in the filter panel', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );
      const nodeList = wrapper.find('.filters-group .node-list-filter-row');
      const tags = getTagData(mockState.spaceflights);
      const elementTypes = Object.keys(sidebarElementTypes);
      expect(nodeList.length).toBe(tags.length + elementTypes.length);
    });

    it('renders the correct number of modular pipelines and nodes in the tree sidepanel', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );

      const nodeList = wrapper.find('.row-text--tree');
      const modularPipelinesTree = getModularPipelinesTree(
        mockState.spaceflights
      );
      expect(nodeList.length).toBe(
        modularPipelinesTree['__root__'].children.length
      );
    });

    it('renders elements panel, filter panel inside a SplitPanel with a handle', () => {
      const wrapper = setup.mount(
        <MemoryRouter>
          <NodesPanel />
        </MemoryRouter>
      );
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

  describe('node list element item checkbox', () => {
    const wrapper = setup.mount(
      <MemoryRouter>
        <NodesPanel />
      </MemoryRouter>
    );
    const checkbox = () => wrapper.find('.node-list-tree-item-row input').at(4);

    it('handles toggle off event', () => {
      checkbox().simulate('change', {
        target: {
          checked: false,
          dataset: {
            iconType: 'focus',
          },
        },
      });
      expect(checkbox().props().checked).toBe(false);
    });

    it('handles toggle on event', () => {
      checkbox().simulate('change', {
        target: {
          checked: true,
          dataset: {
            iconType: 'focus',
          },
        },
      });
      expect(checkbox().props().checked).toBe(true);
    });
  });

  describe('Reset node filters', () => {
    const wrapper = setup.mount(
      <MemoryRouter>
        <NodesPanel />
      </MemoryRouter>
    );

    const resetFilterButton = wrapper.find('.filters__reset-button');

    it('On first load before applying filter button should be disabled', () => {
      expect(resetFilterButton.prop('disabled')).toBe(true);
    });

    it('After applying any filter filter button should not be disabled', () => {
      const nodeTypeFilter = wrapper.find(
        `.toggle-control__checkbox[name="Datasets"]`
      );
      nodeTypeFilter.simulate('click');

      nodeTypeFilter.simulate('change', {
        target: { checked: false },
      });

      setTimeout(() => {
        expect(resetFilterButton.prop('disabled')).toBe(false);
      }, 1); // Wait for 1 second before asserting
    });

    it('should update URL parameters when onResetFilter is called', () => {
      resetFilterButton.simulate('click');

      expect(window.location.search).not.toContain('tags');
    });
  });
});
