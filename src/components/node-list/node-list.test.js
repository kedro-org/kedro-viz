import React from 'react';
import NodeList, { mapStateToProps } from './index';
import SplitPanel from '../split-panel';
import { mockState, setup } from '../../utils/state.mock';
import {
  getNodeData,
  getNodeModularPipelines,
  getGroupedNodes,
  getInputOutputNodesForFocusedModularPipeline,
} from '../../selectors/nodes';
import { getNestedModularPipelines } from './node-list-items';
import { getNodeTypeIDs } from '../../selectors/node-types';
import {
  getModularPipelineData,
  getModularPipelineIDs,
} from '../../selectors/modular-pipelines';
import { getTagData } from '../../selectors/tags';
import IndicatorPartialIcon from '../icons/indicator-partial';
import { localStorageName } from '../../config';
import { toggleTypeDisabled } from '../../actions/node-type';
import { sidebarElementTypes } from '../../config';
import { togglePrettyName } from '../../actions';

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

  describe('tree-search-ui', () => {
    describe('searching through nodes', () => {
      const wrapper = setup.mount(<NodeList />);
      const searches = [
        getNodeData(mockState.animals)[0].name,
        'aaaaaaaaaaaaa',
      ];

      test.each(searches)(
        'filters the nodes and its relevant parent modular pipeline when entering the search text "%s"',
        (searchText) => {
          const search = () => wrapper.find('.kui-input__field');
          search().simulate('change', { target: { value: searchText } });
          const nodeList = wrapper.find(
            '.pipeline-nodelist__elements-panel .pipeline-nodelist__row'
          );
          const nodes = getNodeData(mockState.animals);
          const tags = getTagData(mockState.animals);
          const nodesModularPipelines = getNodeModularPipelines(
            mockState.animals
          );
          const expectedResult = nodes.filter((node) =>
            node.name.includes(searchText)
          );
          const expectedTagResult = tags.filter((tag) =>
            tag.name.includes(searchText)
          );
          const expectedElementTypeResult = Object.keys(
            sidebarElementTypes
          ).filter((type) => type.includes(searchText));
          // obtain the modular pipeline parents
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

    it('clears the search filter input and resets the list when hitting the Escape key', () => {
      const wrapper = setup.mount(
        <NodeList focusMode={null} inputOutputDataNodes={{}} />
      );
      const searchWrapper = wrapper.find('.pipeline-nodelist-search');
      // Re-find elements from root each time to see updates
      const search = () => wrapper.find('.kui-input__field');
      const nodeList = () =>
        wrapper.find(
          '.pipeline-nodelist__elements-panel .pipeline-nodelist__row'
        );

      const nodes = getNodeData(mockState.animals);
      const tags = getTagData(mockState.animals);
      const elementTypes = Object.keys(sidebarElementTypes);
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

      // obtain the nested modular pipeline data to correspond to the node-list-tree layout
      const nestedModularPipelines = getNestedModularPipelines({
        nodes: getGroupedNodes(mockState.animals),
        tags: getTagData(mockState.animals),
        modularPipelines: getModularPipelineData(mockState.animals),
        nodeSelected: {},
        searchValue: '',
        modularPipelineIds: getModularPipelineIDs(mockState.animals),
        nodeModularPipelines: getNodeModularPipelines(mockState.animals),
        nodeTypeIDs: getNodeTypeIDs(mockState.animals),
        inputOutputDataNodes: getInputOutputNodesForFocusedModularPipeline(
          mockState.animals
        ),
      });

      // Check that search input value and node list have been reset
      expect(search().props().value).toBe('');
      expect(nodeList().length).toBe(
        nestedModularPipelines.children.length +
          nestedModularPipelines.nodes.length
      );
    });

    it('search works alongside focus mode', () => {
      const wrapper = setup.mount(
        <NodeList focusMode={{ id: 'pipeline1' }} inputOutputDataNodes={{}} />
      );
      const searchWrapper = wrapper.find('.pipeline-nodelist-search');
      // Re-find elements from root each time to see updates
      const search = () => wrapper.find('.kui-input__field');
      const nodeList = () =>
        wrapper.find(
          '.pipeline-nodelist__elements-panel .pipeline-nodelist__row'
        );

      const nodes = getNodeData(mockState.animals);
      const tags = getTagData(mockState.animals);
      const elementTypes = Object.keys(sidebarElementTypes);
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

      // obtain the nested modular pipeline data to correspond to the node-list-tree layout
      const nestedModularPipelines = getNestedModularPipelines({
        nodes: getGroupedNodes(mockState.animals),
        tags: getTagData(mockState.animals),
        modularPipelines: getModularPipelineData(mockState.animals),
        nodeSelected: {},
        searchValue: '',
        modularPipelineIds: getModularPipelineIDs(mockState.animals),
        nodeModularPipelines: getNodeModularPipelines(mockState.animals),
        nodeTypeIDs: getNodeTypeIDs(mockState.animals),
        inputOutputDataNodes: getInputOutputNodesForFocusedModularPipeline(
          mockState.animals
        ),
      });

      // Check that search input value and node list have been reset
      expect(search().props().value).toBe('');
      expect(nodeList().length).toBe(
        nestedModularPipelines.children.length +
          nestedModularPipelines.nodes.length
      );
    });
  });

  describe('Pretty names in node list', () => {
    const elements = (wrapper) =>
      wrapper
        .find('.MuiTreeItem-label')
        .find('.pipeline-nodelist__row')
        .map((row) => [row.prop('title')]);

    it('shows full node names when pretty name is turned off', () => {
      const wrapper = setup.mount(<NodeList />, {
        beforeLayoutActions: [() => togglePrettyName(false)],
      });
      expect(elements(wrapper)).toEqual([
        ['nested'],
        ['pipeline1'],
        ['pipeline2'],
        ['salmon'],
        ['bear'],
        ['bull'],
        ['cat'],
        ['dog'],
        ['elephant'],
        ['giraffe'],
        ['horse'],
        ['pig'],
        ['sheep'],
        ['parameters'],
        ['params:pipeline100.data_science.plankton'],
        ['params:rabbit'],
      ]);
    });
    it('shows formatted node names when pretty name is turned on', () => {
      const wrapper = setup.mount(<NodeList />, {
        beforeLayoutActions: [() => togglePrettyName(true)],
      });
      expect(elements(wrapper)).toEqual([
        ['Nested'],
        ['Pipeline1'],
        ['Pipeline2'],
        ['Salmon'],
        ['Bear'],
        ['Bull'],
        ['Cat'],
        ['Dog'],
        ['Elephant'],
        ['Giraffe'],
        ['Horse'],
        ['Pig'],
        ['Sheep'],
        ['Parameters'],
        ['Params: Plankton'],
        ['Params: Rabbit'],
      ]);
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
        .find('.MuiTreeItem-label')
        .find('.pipeline-nodelist__row')
        .map((row) => [
          row.prop('title'),
          !row.hasClass('pipeline-nodelist__row--disabled'),
        ]);

    const elementsEnabled = (wrapper) => {
      return elements(wrapper).filter(([_, enabled]) => enabled);
    };

    const tagItem = (wrapper) =>
      wrapper.find('.pipeline-nodelist__group--type-tag');

    const partialIcon = (wrapper) =>
      tagItem(wrapper).find(IndicatorPartialIcon);

    it('selecting tags enables only elements with given tags and modular pipelines', () => {
      //Parameters are enabled here to override the default behavior
      const wrapper = setup.mount(<NodeList />, {
        beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      });

      changeRows(wrapper, ['Small'], true);
      expect(elementsEnabled(wrapper)).toEqual([
        ['Nested', true],
        ['Pipeline1', true],
        ['Pipeline2', true],
        ['Salmon', true],
        ['Bull', true],
        ['Cat', true],
        ['Dog', true],
        ['Horse', true],
        ['Sheep', true],
        ['Parameters', true],
        ['Params: Rabbit', true],
      ]);

      changeRows(wrapper, ['Small', 'Large'], true);
      expect(elementsEnabled(wrapper)).toEqual([
        ['Nested', true],
        ['Pipeline1', true],
        ['Pipeline2', true],
        ['Salmon', true],
        ['Bear', true],
        ['Bull', true],
        ['Cat', true],
        ['Dog', true],
        ['Elephant', true],
        ['Giraffe', true],
        ['Horse', true],
        ['Pig', true],
        ['Sheep', true],
        ['Parameters', true],
        ['Params: Rabbit', true],
      ]);
    });

    it('selecting a tag sorts elements by modular pipelines first then by task, data and parameter nodes ', () => {
      //Parameters are enabled here to override the default behavior
      const wrapper = setup.mount(<NodeList />, {
        beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      });

      // with the modular pipeline tree structure the elements displayed here are for the top level pipeline
      expect(elements(wrapper)).toEqual([
        // modular pipelines (enabled)
        ['Nested', true],
        ['Pipeline1', true],
        ['Pipeline2', true],
        // Tasks (enabled)
        ['Salmon', true],
        ['Bear', true],
        // Datasets (enabled)
        ['Bull', true],
        ['Cat', true],
        ['Dog', true],
        ['Elephant', true],
        ['Giraffe', true],
        ['Horse', true],
        ['Pig', true],
        ['Sheep', true],
        // Parameters(enabled)
        ['Parameters', true],
        ['Params: Plankton', true],
        ['Params: Rabbit', true],
      ]);
    });

    it('adds a class to tag group item when all tags unchecked', () => {
      const wrapper = setup.mount(<NodeList />);
      const uncheckedClass = 'pipeline-nodelist__group--all-unchecked';

      expect(tagItem(wrapper).hasClass(uncheckedClass)).toBe(true);
      changeRows(wrapper, ['Large'], true);
      expect(tagItem(wrapper).hasClass(uncheckedClass)).toBe(false);
      changeRows(wrapper, ['Large'], false);
      expect(tagItem(wrapper).hasClass(uncheckedClass)).toBe(true);
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
    it('renders the correct number of tags in the filter panel', () => {
      const wrapper = setup.mount(<NodeList />);
      const nodeList = wrapper.find(
        '.pipeline-nodelist__list--nested .pipeline-nodelist__row'
      );
      // const nodes = getNodeData(mockState.animals);
      const tags = getTagData(mockState.animals);
      const elementTypes = Object.keys(sidebarElementTypes);
      expect(nodeList.length).toBe(tags.length + elementTypes.length);
    });

    it('renders the correct number of modular pipelines and nodes in the tree sidepanel', () => {
      const wrapper = setup.mount(<NodeList />);
      const nodeList = wrapper.find('.pipeline-nodelist__row__text--tree');

      // with the tree structure we now need to extract nodes that are in the top level modular pipeline
      const nodes = getNodeData(mockState.animals).filter(
        (node) => node.modularPipelines.length === 0
      );
      // Similar to the above, we now need to only extract modular pipelines in the top level only
      const modularPipelines = getModularPipelineData(mockState.animals).filter(
        (modularPipeline) => !modularPipeline.id.includes('.')
      );
      expect(nodeList.length).toBe(nodes.length + modularPipelines.length);
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
    // this needs to be the 4th element as the first 3 elements are modular pipelines rows which does not apply the '--active' class
    const nodeRow = () => wrapper.find('.pipeline-nodelist__row').at(4);

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
    const checkbox = () => wrapper.find('.pipeline-nodelist__row input').at(4);

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
        disabledNode: expect.any(Boolean),
        disabledTag: expect.any(Boolean),
        disabledType: expect.any(Boolean),
        disabledModularPipeline: expect.any(Boolean),
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
      nodeTypes: expect.any(Array),
      modularPipelines: expect.any(Object),
    });
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });
});
