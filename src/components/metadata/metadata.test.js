import React from 'react';
import MetaData from './index';
import { toggleTypeDisabled } from '../../actions/node-type';
import { toggleNodeClicked, addNodeMetadata } from '../../actions/nodes';
import { setup } from '../../utils/state.mock';
import node_plot from '../../utils/data/node_plot.mock.json';
import { mapDispatchToProps } from './index';
import node_parameters from '../../utils/data/node_parameters.mock.json';
import node_task from '../../utils/data/node_task.mock.json';
import node_data from '../../utils/data/node_data.mock.json';
import nodeTranscodedData from '../../utils/data/node_transcoded_data.mock.json';

const salmonTaskNodeId = '443cf06a';
const catDatasetNodeId = '9d989e8d';
const rabbitParamsNodeId = 'c38d4c6a';
const bullPlotNodeId = 'c3p345ed';
const bearDatasetNodeId = '09f5edeb';

describe('MetaData', () => {
  const mount = (props) => {
    return setup.mount(<MetaData visible={true} />, {
      //parameters are enabled here to test all metadata panel functionality
      beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      afterLayoutActions: [
        // Click the expected node
        () => toggleNodeClicked(props.nodeId),
        //simulating loadNodeData in node.js
        () => addNodeMetadata({ id: props.nodeId, data: props.mockMetadata }),
      ],
    });
  };

  const textOf = (elements) => elements.map((element) => element.text());
  const title = (wrapper) => wrapper.find('.pipeline-metadata__title');
  const rowIcon = (row) => row.find('svg.pipeline-metadata__icon');
  const rowValue = (row) => row.find('.pipeline-metadata__value');
  const rowObject = (row) => row.find('.pipeline-metadata__object');
  const rowByLabel = (wrapper, label) =>
    // Using attribute since traversal by sibling not supported
    wrapper.find(`.pipeline-metadata__row[data-label="${label}"]`);

  describe('All nodes', () => {
    it('when parameters are returned an array and displayed as a list - it limits parameters to 10 values and expands when button clicked', () => {
      // Get metadata for a sample
      const metadata = {};
      metadata.parameters = Array.from({ length: 20 }, (_, i) => `Test: ${i}`);

      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: metadata,
      });
      const parametersRow = () => rowByLabel(wrapper, 'Parameters:');
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
    it('shows the code toggle for task nodes with code', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      expect(wrapper.find('.pipeline-toggle').length).toBe(1);
    });

    it('shows the node type as an icon', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      expect(rowIcon(wrapper).hasClass('pipeline-node-icon--icon-task')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      expect(textOf(title(wrapper))).toEqual(['salmon']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['task']);
    });

    it('does not display the node parameter row when there are no parameters', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      const row = rowByLabel(wrapper, 'Parameters:');
      //this is the metadata output when there is no data
      expect(textOf(rowObject(row))).toEqual(['-']);
    });

    it('shows the node parameters when there are parameters', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_parameters,
      });
      const row = rowByLabel(wrapper, 'Parameters:');
      //this is output of react-json-view with 3 parameters
      expect(textOf(rowObject(row))[0]).toEqual(
        expect.stringContaining('3 items')
      );
    });

    it('shows the node inputs', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      const row = rowByLabel(wrapper, 'Inputs:');
      expect(textOf(rowValue(row))).toEqual([
        'Cat',
        'Dog',
        'Parameters',
        'Params:rabbit',
      ]);
    });

    it('shows the node outputs', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      const row = rowByLabel(wrapper, 'Outputs:');
      expect(textOf(rowValue(row))).toEqual(['Horse', 'Sheep']);
    });

    it('shows the node tags', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Small']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({
        nodeId: salmonTaskNodeId,
        mockMetadata: node_task,
      });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });
    describe('when there is no runCommand returned by the backend', () => {
      it('should show a help message asking user to provide a name property', () => {
        const wrapper = mount({
          nodeId: salmonTaskNodeId,
          mockMetadata: node_task,
        });
        const row = rowByLabel(wrapper, 'Run Command:');
        expect(textOf(rowValue(row))).toEqual([
          'Please provide a name argument for this node in order to see a run command.',
        ]);
      });
    });

    describe('when there is a runCommand returned by the backend', () => {
      const metadata = {};
      // Add runCommand which would be returned by the server
      metadata.run_command = 'kedro run --to-nodes="salmon"';

      it('shows the node run command', () => {
        const wrapper = mount({
          nodeId: catDatasetNodeId,
          mockMetadata: metadata,
        });

        const row = rowByLabel(wrapper, 'Run Command:');
        expect(textOf(rowValue(row))).toEqual([
          'kedro run --to-nodes="salmon"',
        ]);
      });

      it('copies run command when button clicked', () => {
        window.navigator.clipboard = {
          writeText: jest.fn(),
        };

        const wrapper = mount({
          nodeId: catDatasetNodeId,
          mockMetadata: metadata,
        });

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
      const wrapper = mount({
        nodeId: catDatasetNodeId,
        mockMetadata: node_data,
      });
      expect(rowIcon(wrapper).hasClass('pipeline-node-icon--icon-data')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({
        nodeId: catDatasetNodeId,
        mockMetadata: node_data,
      });
      expect(textOf(title(wrapper))).toEqual(['Cat']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({
        nodeId: catDatasetNodeId,
        mockMetadata: node_data,
      });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['data']);
    });

    it('shows the node dataset type', () => {
      const wrapper = mount({
        nodeId: catDatasetNodeId,
        mockMetadata: node_data,
      });
      const row = rowByLabel(wrapper, 'Dataset Type:');
      expect(textOf(rowValue(row))).toEqual([
        'kedro.extras.datasets.pandas.csv_dataset.CSVDataSet',
      ]);
    });

    it('shows the node filepath', () => {
      const wrapper = mount({
        nodeId: catDatasetNodeId,
        mockMetadata: node_data,
      });
      const row = rowByLabel(wrapper, 'File Path:');
      expect(textOf(rowValue(row))).toEqual([
        '/Users/Documents/project-src/test/data/01_raw/iris.csv',
      ]);
    });

    it('shows the node tags', () => {
      const wrapper = mount({
        nodeId: catDatasetNodeId,
        mockMetadata: node_data,
      });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Large', 'Medium', 'Small']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({
        nodeId: catDatasetNodeId,
        mockMetadata: node_data,
      });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });

    describe('when there is a runCommand returned by the backend', () => {
      const metadata = {};
      // Add runCommand which would be returned by the server
      metadata.run_command = 'kedro run --to-outputs="cat"';

      it('shows the node run command', () => {
        const wrapper = mount({
          nodeId: catDatasetNodeId,
          mockMetadata: metadata,
        });

        const row = rowByLabel(wrapper, 'Run Command:');
        expect(textOf(rowValue(row))).toEqual(['kedro run --to-outputs="cat"']);
      });

      it('copies run command when button clicked', () => {
        window.navigator.clipboard = {
          writeText: jest.fn(),
        };

        const wrapper = mount({
          nodeId: catDatasetNodeId,
          mockMetadata: metadata,
        });

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

  describe('Transcoded dataset nodes', () => {
    it('shows the node type as an icon', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      expect(rowIcon(wrapper).hasClass('pipeline-node-icon--icon-data')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      expect(textOf(title(wrapper))).toEqual(['Bear']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['data']);
    });

    it('shows the node original type', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      const row = rowByLabel(wrapper, 'Original Type:');
      expect(textOf(rowValue(row))).toEqual([
        'kedro.extras.datasets.spark.spark_dataset.SparkDataSet',
      ]);
    });

    it('shows the node transcoded type', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      const row = rowByLabel(wrapper, 'Transcoded Types:');
      expect(textOf(rowValue(row))).toEqual([
        'kedro.extras.datasets.pandas.parquet_dataset.ParquetDataSet',
      ]);
    });

    it('shows the node filepath', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      const row = rowByLabel(wrapper, 'File Path:');
      expect(textOf(rowValue(row))).toEqual([
        '/Users/Documents/project-src/test/data/01_raw/iris.csv',
      ]);
    });

    it('shows the node tags', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Large', 'Medium']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({
        nodeId: bearDatasetNodeId,
        mockMetadata: nodeTranscodedData,
      });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });
  });

  describe('Parameter nodes', () => {
    it('shows the node type as an icon', () => {
      const wrapper = mount({
        nodeId: rabbitParamsNodeId,
        mockMetadata: node_parameters,
      });
      expect(
        rowIcon(wrapper).hasClass('pipeline-node-icon--icon-parameters')
      ).toBe(true);
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({
        nodeId: rabbitParamsNodeId,
        mockMetadata: node_parameters,
      });
      expect(textOf(title(wrapper))).toEqual(['Params:rabbit']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({
        nodeId: rabbitParamsNodeId,
        mockMetadata: node_parameters,
      });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['parameters']);
    });

    it('shows the node filepath', () => {
      const wrapper = mount({
        nodeId: rabbitParamsNodeId,
        mockMetadata: node_parameters,
      });
      const row = rowByLabel(wrapper, 'File Path:');
      expect(textOf(rowValue(row))).toEqual(['-']);
    });

    it('shows the first line (number of parameters) displayed in json viewer for parameter object', () => {
      const wrapper = mount({
        nodeId: rabbitParamsNodeId,
        mockMetadata: node_parameters,
      });
      const row = rowByLabel(wrapper, 'Parameters:');
      expect(textOf(rowObject(row))[0]).toEqual(
        expect.stringContaining('3 items')
      );
    });

    it('shows the node tags', () => {
      const wrapper = mount({
        nodeId: rabbitParamsNodeId,
        mockMetadata: node_parameters,
      });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Small']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({
        nodeId: rabbitParamsNodeId,
        mockMetadata: node_parameters,
      });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });
  });

  describe('Plot nodes', () => {
    it('shows the node type as an icon', () => {
      const wrapper = mount({
        nodeId: bullPlotNodeId,
        mockMetadata: node_plot,
      });
      expect(rowIcon(wrapper).hasClass('pipeline-node-icon--icon-plotly')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const wrapper = mount({
        nodeId: bullPlotNodeId,
        mockMetadata: node_plot,
      });
      expect(textOf(title(wrapper))).toEqual(['Bull']);
    });

    it('shows the node type as text', () => {
      const wrapper = mount({
        nodeId: bullPlotNodeId,
        mockMetadata: node_plot,
      });
      const row = rowByLabel(wrapper, 'Type:');
      expect(textOf(rowValue(row))).toEqual(['data']);
    });

    it('shows the node filepath', () => {
      const wrapper = mount({
        nodeId: bullPlotNodeId,
        mockMetadata: node_plot,
      });
      const row = rowByLabel(wrapper, 'File Path:');
      expect(textOf(rowValue(row))).toEqual(['-']);
    });

    it('shows the node tags', () => {
      const wrapper = mount({
        nodeId: bullPlotNodeId,
        mockMetadata: node_plot,
      });
      const row = rowByLabel(wrapper, 'Tags:');
      expect(textOf(rowValue(row))).toEqual(['Small']);
    });

    it('shows the node pipeline', () => {
      const wrapper = mount({
        nodeId: bullPlotNodeId,
        mockMetadata: node_plot,
      });
      const row = rowByLabel(wrapper, 'Pipeline:');
      expect(textOf(rowValue(row))).toEqual(['Default']);
    });

    describe('shows the plot info', () => {
      const wrapper = mount({
        nodeId: bullPlotNodeId,
        mockMetadata: node_plot,
      });
      it('shows the plotly chart', () => {
        expect(wrapper.find('.pipeline-metadata__plot').length).toBe(1);
      });
      it('shows the plotly expand button', () => {
        expect(wrapper.find('.pipeline-metadata__expand-plot').length).toBe(1);
      });
    });
  });

  describe('mapDispatchToProps', () => {
    it('onToggleNodeSelected', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleNodeSelected(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        nodeClicked: true,
        type: 'TOGGLE_NODE_CLICKED',
      });
    });

    it('onToggleCode', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleCode(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_CODE',
      });
    });

    it('onTogglePlotModal', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onTogglePlotModal(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_PLOT_MODAL',
      });
    });
  });
});
