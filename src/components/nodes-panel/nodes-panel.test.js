//TODO FIX COMMENTED TESTS
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { toggleIsPrettyName } from '../../actions';
import {
  getNodeData,
  getModularPipelinesTree,
  getNodeModularPipelines,
} from '../../selectors/nodes';
import { getTagData } from '../../selectors/tags';
import { toggleTypeDisabled } from '../../actions/node-type';
import { prepareState, mockState, setup } from '../../utils/state.mock';
import { sidebarElementTypes } from '../../config';
import spaceflights from '../../utils/data/spaceflights.mock.json';
import NodesPanel from './index';
jest.mock('lodash/debounce', () => (fn) => {
  fn.cancel = jest.fn();
  return fn;
});

describe('NodesPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders without crashing', () => {
    setup.render(<NodesPanel />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  describe('tree-search-ui', () => {
    it.each(['metrics', 'preprocess', 'aaaaaaaaaaaaa'])(
      'displays nodes matching search value "%s"',
      (searchText) => {
        setup.render(<NodesPanel />);
        const input = screen.getByPlaceholderText(/search/i);
        fireEvent.change(input, { target: { value: searchText } });

        const nodes = getNodeData(mockState.spaceflights);
        const tags = getTagData(mockState.spaceflights);
        const modulars = getNodeModularPipelines(mockState.spaceflights);

        const expectedNodes = nodes.filter((node) =>
          node.name.toLowerCase().includes(searchText)
        );
        const expectedTags = tags.filter((tag) =>
          tag.name.toLowerCase().includes(searchText)
        );
        const expectedTypes = Object.keys(sidebarElementTypes).filter((type) =>
          type.toLowerCase().includes(searchText)
        );
        const expectedModulars = modulars[searchText] || [];

        const expectedCount =
          expectedNodes.length +
          expectedTags.length +
          expectedTypes.length +
          expectedModulars.length;

        const renderedTreeItems = screen.queryAllByRole('treeitem');
        expect(renderedTreeItems.length).toBe(expectedCount);
      }
    );

    it('clears the search and resets list on Escape key', async () => {
      setup.render(<NodesPanel />);
      const input = screen.getByPlaceholderText(/search/i);
      fireEvent.change(input, { target: { value: 'metrics' } });
      fireEvent.keyDown(input, { key: 'Escape', keyCode: 27 });

      await waitFor(() => {
        expect(input).toHaveValue('');
        const expectedLength = getModularPipelinesTree(mockState.spaceflights)[
          '__root__'
        ].children.length;
        expect(screen.getAllByRole('treeitem').length).toBe(expectedLength);
      });
    });

    it('displays results correctly in focus mode', async () => {
      setup.render(<NodesPanel focusMode={{ id: 'data_science' }} />);
      const input = screen.getByPlaceholderText(/search/i);
      fireEvent.change(input, { target: { value: 'metrics' } });

      await waitFor(() => {
        const nodes = getNodeData(mockState.spaceflights);
        const tags = getTagData(mockState.spaceflights);
        const types = Object.keys(sidebarElementTypes);

        const matchNodes = nodes.filter((node) =>
          node.name.includes('metrics')
        ).length;
        const matchTags = tags.filter((tag) =>
          tag.name.includes('metrics')
        ).length;
        const matchTypes = types.filter((type) =>
          type.includes('metrics')
        ).length;

        expect(screen.getAllByRole('treeitem').length).toBe(
          matchNodes + matchTags + matchTypes
        );
      });
    });
  });

  describe('Pretty name toggle', () => {
    const getNodeTitles = () =>
      Array.from(document.querySelectorAll('.node-list-tree-item-row')).map(
        (el) => el.title
      );

    it('shows raw names when pretty name is false', () => {
      setup.render(<NodesPanel />, {
        beforeLayoutActions: [() => toggleIsPrettyName(false)],
        data: spaceflights,
      });
      expect(getNodeTitles()).toEqual([
        'data_processing',
        'data_science',
        'metrics',
        'model_input_table',
        'parameters',
      ]);
    });

    it('shows formatted node names when pretty name is turned on', () => {
      setup.render(<NodesPanel />, {
        state: prepareState({
          beforeLayoutActions: [() => toggleIsPrettyName(true)],
          data: spaceflights,
        }),
      });

      const labels = screen
        .getAllByRole('treeitem')
        .map((el) => el.textContent?.trim());

      expect(labels).toEqual([
        'Data Processing',
        'Data Science',
        'Metrics',
        'Model Input Table',
        'Parameters',
      ]);
    });
  });

  describe('checkboxes on tag filter items', () => {
    it('selecting a tag sorts elements by modular pipelines first then by task, data and parameter nodes', () => {
      const { container } = setup.render(<NodesPanel />, {
        state: prepareState({
          data: spaceflights,
          beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
        }),
      });

      const labels = Array.from(
        container.querySelectorAll(
          '.MuiTreeItem-label .node-list-tree-item-row'
        )
      ).map((el) => [el.title, !el.classList.contains('row--disabled')]);

      expect(labels).toEqual([
        ['data_processing', true],
        ['data_science', true],
        ['metrics', true],
        ['model_input_table', true],
        ['parameters', true],
      ]);
    });

    it('adds a class to tag group item when all tags unchecked', () => {
      const { container } = setup.render(<NodesPanel />);
      const tagSection = container.querySelector('.filters-section--type-tag');
      const checkbox = container.querySelector('input[name="Preprocessing"]');

      expect(
        tagSection.classList.contains('filters-section--all-unchecked')
      ).toBe(true);

      fireEvent.click(checkbox);
      expect(
        tagSection.classList.contains('filters-section--all-unchecked')
      ).toBe(false);

      fireEvent.click(checkbox);
      expect(
        tagSection.classList.contains('filters-section--all-unchecked')
      ).toBe(true);
    });

    it('adds a class to the row when a tag row is unchecked', () => {
      const { container } = setup.render(<NodesPanel />);
      const row = container.querySelector(
        '.node-list-filter-row[title="Preprocessing"]'
      );
      const checkbox = row.querySelector('input');

      expect(
        row.querySelector('.toggle-control--icon--unchecked')
      ).toBeTruthy();

      fireEvent.click(checkbox); // check
      expect(row.querySelector('.toggle-control--icon--unchecked')).toBeFalsy();

      fireEvent.click(checkbox); // uncheck again
      expect(
        row.querySelector('.toggle-control--icon--unchecked')
      ).toBeTruthy();
    });

    // TODO THIS TEST NEEDS TO BE FIXED
    // it('shows as partially selected when at least one but not all tags are selected', () => {
    //   const { container } = setup.render(<NodesPanel />);

    //   const preprocessing = container.querySelector('input[name="Preprocessing"]');
    //   const otherTags = ['Features', 'Split', 'Train'].map((name) =>
    //     container.querySelector(`input[name="${name}"]`)
    //   );

    //   // Uncheck all to start from a clean state
    //   if (preprocessing.checked) fireEvent.click(preprocessing);
    //   otherTags.forEach((cb) => {
    //     if (cb.checked) fireEvent.click(cb);
    //   });

    //   // No visible partial icon at the beginning
    //   expect(
    //     screen.queryAllByTestId('partial-icon').filter((el) => el.offsetParent !== null)
    //   ).toHaveLength(0);

    //   // Select one tag → icon should now be visible
    //   fireEvent.click(preprocessing);
    //   expect(
    //     screen.queryAllByTestId('partial-icon').filter((el) => el.offsetParent !== null)
    //   ).toHaveLength(1);

    //   // Select the rest
    //   otherTags.forEach((cb) => fireEvent.click(cb));
    //   expect(
    //     screen.queryAllByTestId('partial-icon').filter((el) => el.offsetParent !== null)
    //   ).toHaveLength(1);
    // });

    // TODO THIS TEST NEEDS TO BE FIXED
    //   it('saves enabled tags in localStorage on selecting a tag on node-list', () => {
    //     const { container } = setup.render(<NodesPanel />);
    //     const preprocessing = container.querySelector('input[name="Preprocessing"]');
    //     fireEvent.click(preprocessing);

    //     const storage = JSON.parse(localStorage.getItem(localStorageName));
    //     console.log(storage);
    //     expect(storage.tag.enabled.preprocessing).toBe(true);
    //   });
  });

  describe('node list', () => {
    // it('renders the correct number of tags in the filter panel', () => {
    //   setup.render(<NodesPanel />);
    //   const tagCheckboxes = screen
    //     .getAllByRole('checkbox')
    //     .filter((checkbox) => {
    //       const name = checkbox.getAttribute('name');
    //       return name && !['Parameters', 'Datasets', 'Nodes'].includes(name);
    //     });
    //   const tags = getTagData(mockState.spaceflights);
    //   const elementTypes = Object.keys(sidebarElementTypes);
    //   expect(tagCheckboxes.length).toBe(tags.length + elementTypes.length);
    // });

    it('renders the correct number of modular pipelines and nodes in the tree sidepanel', () => {
      setup.render(<NodesPanel />);
      const rows = screen.getAllByRole('checkbox', { hidden: true });
      const modularPipelinesTree = getModularPipelinesTree(
        mockState.spaceflights
      );
      const expectedCount = modularPipelinesTree['__root__'].children.length;
      expect(rows.length).toBeGreaterThanOrEqual(expectedCount);
    });

    it('renders elements panel, filter panel inside a SplitPanel with a handle', () => {
      const { container } = setup.render(<NodesPanel />);
      expect(
        container.querySelector('.pipeline-nodelist__split')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.pipeline-nodelist__elements-panel')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.pipeline-nodelist__filter-panel')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.pipeline-nodelist__split-handle')
      ).toBeInTheDocument();
    });
  });

  describe('node list element item checkbox', () => {});

  describe('Reset node filters', () => {
    it('filter reset button is disabled on initial load', () => {
      const { container } = setup.render(<NodesPanel />);
      const resetButton = container.querySelector('.filters__reset-button');
      expect(resetButton.disabled).toBe(true);
    });

    it('filter reset button is enabled after applying a filter', async () => {
      const { container } = setup.render(<NodesPanel />);
      const datasetCheckbox = container.querySelector(
        '.toggle-control__checkbox[name="Datasets"]'
      );
      const resetButton = container.querySelector('.filters__reset-button');

      fireEvent.click(datasetCheckbox);
      fireEvent.change(datasetCheckbox, { target: { checked: false } });

      await waitFor(() => {
        expect(resetButton.disabled).toBe(false);
      });
    });

    it('clicking reset button clears filters and updates URL', () => {
      const { container } = setup.render(<NodesPanel />);
      const resetButton = container.querySelector('.filters__reset-button');
      fireEvent.click(resetButton);
      expect(window.location.search).not.toContain('tags');
    });
  });
});
