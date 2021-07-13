import React from 'react';
import MetaData from './index';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import { toggleTypeDisabled } from '../../actions/node-type';
import { toggleNodeClicked } from '../../actions/nodes';
import { setup, prepareState } from '../../utils/state.mock';
import animals from '../../utils/data/animals.mock.json';
import node_plot from '../../utils/data/node_plot.mock.json';

const salmonTaskNodeId = '443cf06a';
const catDatasetNodeId = '9d989e8d';
const rabbitParamsNodeId = 'c38d4c6a';
const bullPlotNodeID = 'c3p345ed';

describe('MetaData', () => {
  const mount = (props) => {
    return setup.mount(<MetaData visible={true} />, {
      afterLayoutActions: [
        // Click the expected node
        () => toggleNodeClicked(props.nodeId),
      ],
    });
  };

  afterEach(() => {
    toggleTypeDisabled('parameters', true);
  });

  const textOf = (elements) => elements.map((element) => element.text());
  const title = (wrapper) => wrapper.find('.pipeline-metadata__title');
  const rowIcon = (row) => row.find('svg.pipeline-metadata__icon');
  const rowValue = (row) => row.find('.pipeline-metadata__value');
  const rowByLabel = (wrapper, label) =>
    // Using attribute since traversal by sibling not supported
    wrapper.find(`.pipeline-metadata__row[data-label="${label}"]`);

  describe('All nodes', () => {
    it('limits parameters to 10 values and expands when button clicked', () => {
      // Get metadata for a sample
      const metadata = getClickedNodeMetaData(
        prepareState({
          data: animals,
          afterLayoutActions: [() => toggleNodeClicked(salmonTaskNodeId)],
        })
      );
      // Add extra mock parameters
      metadata.parameters = Array.from({ length: 20 }, (_, i) => `Test: ${i}`);

      const wrapper = setup.mount(
        <MetaData visible={true} metadata={metadata} />
      );

      const parametersRow = () => rowByLabel(wrapper, 'Parameters (20):');
      const expandButton = parametersRow().find(
        '.pipeline-metadata__value-list-expand'
      );

      // Expand button should show remainder
      expect(expandButton.text()).toBe('+ 10 more');

      // Should show 10 values
      expect(parametersRow().find('.pipeline-metadata__value').length).toBe(10);

      // User clicks to expand
      expandButton.simulate('click');

      // Should show all 20 values
      expect(parametersRow().find('.pipeline-metadata__value').length).toBe(20);
    });
  });

  describe('Task nodes', () => {
    it('shows the node type as an icon', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      expect(rowIcon(wrapper).hasClass('pipeline-node-icon--icon-task')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      expect(textOf(title(wrapper))).toEqual(['salmon']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['task']);
    });

    it('shows the node parameters', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      const row = rowByLabel(wrapper, 'Parameters (-):');
      expect(textOf(rowValue(row))).toEqual(['-']);
    });

    it('shows the node inputs when parameters are disabled (default)', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      const row = rowByLabel(wrapper, 'Inputs:');
      expect(textOf(rowValue(row))).toEqual(['Cat', 'Dog']);
    });

    it('shows the node inputs when parameters are enabled', () => {
      const mount = (props) => {
        return setup.mount(<MetaData visible={true} />, {
          beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
          afterLayoutActions: [
            () => {
              // Click the expected node
              return toggleNodeClicked(props.nodeId);
            },
          ],
        });
      };
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      const row = rowByLabel(wrapper, 'Inputs:');
      expect(textOf(rowValue(row))).toEqual([
        'Cat',
        'Dog',
        'Parameters',
        'Params:rabbit',
      ]);
    });

    it('shows the node outputs', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      const row = rowByLabel(wrapper, 'Outputs:');
      expect(textOf(rowValue(row))).toEqual(['Horse', 'Sheep']);
    });

    it('shows the node tags', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Small']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({ nodeId: salmonTaskNodeId });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });
    describe('when there is no runCommand returned by the backend', () => {
      it('should show a help message asking user to provide a name property', () => {
        const wrapper = mount({ nodeId: salmonTaskNodeId });
        const row = rowByLabel(wrapper, 'Run Command:');
        expect(textOf(rowValue(row))).toEqual([
          'Please provide a name argument for this node in order to see a run command.',
        ]);
      });
    });

    describe('when there is a runCommand returned by the backend', () => {
      const metadata = getClickedNodeMetaData(
        prepareState({
          data: animals,
          afterLayoutActions: [() => toggleNodeClicked(salmonTaskNodeId)],
        })
      );
      // Add runCommand which would be returned by the server
      metadata.runCommand = 'kedro run --to-nodes="salmon"';

      it('shows the node run command', () => {
        const wrapper = setup.mount(
          <MetaData visible={true} metadata={metadata} />
        );

        const row = rowByLabel(wrapper, 'Run Command:');
        expect(textOf(rowValue(row))).toEqual([
          'kedro run --to-nodes="salmon"',
        ]);
      });

      it('copies run command when button clicked', () => {
        window.navigator.clipboard = {
          writeText: jest.fn(),
        };

        const wrapper = setup.mount(
          <MetaData visible={true} metadata={metadata} />
        );
        const copyButton = wrapper.find(
          'button.pipeline-metadata__copy-button'
        );

        copyButton.simulate('click');

        expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
          'kedro run --to-nodes="salmon"'
        );
      });
    });
  });

  describe('Dataset nodes', () => {
    it('shows the node type as an icon', () => {
      const wrapper = mount({ nodeId: catDatasetNodeId });
      expect(rowIcon(wrapper).hasClass('pipeline-node-icon--icon-data')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({ nodeId: catDatasetNodeId });
      expect(textOf(title(wrapper))).toEqual(['Cat']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({ nodeId: catDatasetNodeId });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['data']);
    });

    it('shows the node dataset type', () => {
      const wrapper = mount({ nodeId: catDatasetNodeId });
      const row = rowByLabel(wrapper, 'Dataset Type:');
      expect(textOf(rowValue(row))).toEqual(['-']);
    });

    it('shows the node filepath', () => {
      const wrapper = mount({ nodeId: catDatasetNodeId });
      const row = rowByLabel(wrapper, 'File Path:');
      expect(textOf(rowValue(row))).toEqual(['-']);
    });

    it('shows the node tags', () => {
      const wrapper = mount({ nodeId: catDatasetNodeId });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Large', 'Medium', 'Small']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({ nodeId: catDatasetNodeId });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });

    describe('when there is a runCommand returned by the backend', () => {
      const metadata = getClickedNodeMetaData(
        prepareState({
          data: animals,
          afterLayoutActions: [() => toggleNodeClicked(catDatasetNodeId)],
        })
      );
      // Add runCommand which would be returned by the server
      metadata.runCommand = 'kedro run --to-outputs="cat"';

      it('shows the node run command', () => {
        const wrapper = setup.mount(
          <MetaData visible={true} metadata={metadata} />
        );
        const row = rowByLabel(wrapper, 'Run Command:');
        expect(textOf(rowValue(row))).toEqual(['kedro run --to-outputs="cat"']);
      });

      it('copies run command when button clicked', () => {
        window.navigator.clipboard = {
          writeText: jest.fn(),
        };

        const wrapper = setup.mount(
          <MetaData visible={true} metadata={metadata} />
        );
        const copyButton = wrapper.find(
          'button.pipeline-metadata__copy-button'
        );

        copyButton.simulate('click');

        expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
          'kedro run --to-outputs="cat"'
        );
      });
    });
  });

  describe('Parameter nodes', () => {
    describe('when parameters are enabled', () => {
      const mount = (props) => {
        return setup.mount(<MetaData visible={true} />, {
          beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
          afterLayoutActions: [
            () => {
              // Click the expected node
              return toggleNodeClicked(props.nodeId);
            },
          ],
        });
      };
      it('shows the node type as an icon', () => {
        const wrapper = mount({ nodeId: rabbitParamsNodeId });
        expect(
          rowIcon(wrapper).hasClass('pipeline-node-icon--icon-parameters')
        ).toBe(true);
      });

      it('shows the node name as the title', () => {
        const wrapper = mount({ nodeId: rabbitParamsNodeId });
        expect(textOf(title(wrapper))).toEqual(['Params:rabbit']);
      });

      it('shows the node type as text', () => {
        const wrapper = mount({ nodeId: rabbitParamsNodeId });
        const row = rowByLabel(wrapper, 'Type:');
        expect(textOf(rowValue(row))).toEqual(['parameters']);
      });

      it('shows the node filepath', () => {
        const wrapper = mount({ nodeId: rabbitParamsNodeId });
        const row = rowByLabel(wrapper, 'File Path:');
        expect(textOf(rowValue(row))).toEqual(['-']);
      });

      it('shows the node parameters', () => {
        const wrapper = mount({ nodeId: rabbitParamsNodeId });
        const row = rowByLabel(wrapper, 'Parameters (-):');
        expect(textOf(rowValue(row))).toEqual(['-']);
      });

      it('shows the node tags', () => {
        const wrapper = mount({ nodeId: rabbitParamsNodeId });
        const row = rowByLabel(wrapper, 'Tags:');
        expect(textOf(rowValue(row))).toEqual(['Small']);
      });

      it('shows the node pipeline', () => {
        const wrapper = mount({ nodeId: rabbitParamsNodeId });
        const row = rowByLabel(wrapper, 'Pipeline:');
        expect(textOf(rowValue(row))).toEqual(['Default']);
      });
    });
  });

  describe('Plot nodes', () => {
    it('shows the node type as an icon', () => {
      const wrapper = mount({ nodeId: bullPlotNodeID });
      expect(rowIcon(wrapper).hasClass('pipeline-node-icon--icon-plotly')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({ nodeId: bullPlotNodeID });
      expect(textOf(title(wrapper))).toEqual(['Bull']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({ nodeId: bullPlotNodeID });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['data']);
    });

    it('shows the node filepath', () => {
      const wrapper = mount({ nodeId: bullPlotNodeID });
      const row = rowByLabel(wrapper, 'File Path:');
      expect(textOf(rowValue(row))).toEqual(['-']);
    });

    it('shows the node parameters', () => {
      const wrapper = mount({ nodeId: bullPlotNodeID });
      const row = rowByLabel(wrapper, 'Parameters (-):');
      expect(textOf(rowValue(row))).toEqual([]);
    });

    it('shows the node tags', () => {
      const wrapper = mount({ nodeId: bullPlotNodeID });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Small']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({ nodeId: bullPlotNodeID });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });

    describe('shows the plot info', () => {
      const metadata = getClickedNodeMetaData(
        prepareState({
          data: animals,
          afterLayoutActions: [() => toggleNodeClicked(bullPlotNodeID)],
        })
      );
      metadata.plot = node_plot.plot;

      const wrapper = setup.mount(
        <MetaData visible={true} metadata={metadata} />
      );

      it('shows the plotly chart', () => {
        expect(wrapper.find('.pipeline-metadata__plot').length).toBe(1);
      });
      it('shows the plotly expand button', () => {
        expect(wrapper.find('.pipeline-metadata__expand-plot').length).toBe(1);
      });
    });
  });
});
