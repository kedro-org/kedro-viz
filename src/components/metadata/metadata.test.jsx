import React from 'react';
import { fireEvent } from '@testing-library/react';
import MetaData from './metadata';
import { toggleIsPrettyName } from '../../actions';
import { toggleNodeClicked, addNodeMetadata } from '../../actions/nodes';
import { toggleModularPipelinesExpanded } from '../../actions/modular-pipelines';
import { setup, prepareState } from '../../utils/state.mock';
import nodeParameters from '../../utils/data/node_parameters.mock.json';
import nodeTask from '../../utils/data/node_task.mock.json';
import nodePlot from '../../utils/data/node_plot.mock.json';
import nodeData from '../../utils/data/node_data.mock.json';
import nodeDataStats from '../../utils/data/node_data_stats.mock.json';
import nodeTranscodedData from '../../utils/data/node_transcoded_data.mock.json';
import spaceflights from '../../utils/data/spaceflights.mock.json';
import { formatFileSize } from '../../utils';

const modelInputDatasetNodeId = '23c94afb';
const splitDataTaskNodeId = '65d0d789';
const parametersNodeId = 'f1f1425b';
const dataScienceNodeId = 'data_science';
const dataProcessingNodeId = 'data_processing';

const renderWithState = ({ nodeId, mockMetadata, extraBefore = [] }) =>
  setup.render(<MetaData visible={true} />, {
    state: prepareState({
      beforeLayoutActions: [
        () =>
          toggleModularPipelinesExpanded([
            dataScienceNodeId,
            dataProcessingNodeId,
          ]),
        ...extraBefore,
      ],
      data: spaceflights,
      afterLayoutActions: [
        () => toggleNodeClicked(nodeId),
        () => addNodeMetadata({ id: nodeId, data: mockMetadata }),
      ],
    }),
  });

const queryRowByLabel = (container, label) =>
  container.querySelector(`.pipeline-metadata__row[data-label="${label}"]`);

const getRowValues = (row) =>
  Array.from(row?.querySelectorAll('.pipeline-metadata__value') || []).map(
    (el) => el.textContent.trim()
  );

const getTitle = (container) =>
  container.querySelector('.pipeline-metadata__title')?.textContent.trim();

const clickCopyButton = (container) =>
  fireEvent.click(container.querySelector('button.copy-button'));

describe('MetaData', () => {
  describe('All nodes', () => {
    it('limits parameters to 10 values and expands when button clicked', () => {
      const metadata = {
        parameters: Array.from({ length: 20 }, (_, i) => `Test: ${i}`),
      };

      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: metadata,
      });

      const parametersRow = queryRowByLabel(container, 'Parameters:');
      const expandButton = parametersRow?.querySelector(
        '.pipeline-metadata__value-list-expand'
      );

      expect(expandButton).toHaveTextContent('+ 10 more');

      // Initially, only 10 values shown
      const initialValues = parametersRow?.querySelectorAll(
        '.pipeline-metadata__value'
      );
      expect(initialValues.length).toBe(10);

      // Expand and check all 20 values
      fireEvent.click(expandButton);
      const expandedValues = parametersRow?.querySelectorAll(
        '.pipeline-metadata__value'
      );
      expect(expandedValues.length).toBe(20);
    });

    it('displays raw name in title and pretty name below when pretty name is off', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
        extraBefore: [() => toggleIsPrettyName(false)],
      });

      expect(getTitle(container)).toBe('parameters');

      const row = queryRowByLabel(container, 'Pretty node name:');
      expect(getRowValues(row)).toEqual(['Parameters']);
    });

    it('displays formatted title and raw name below when pretty name is on', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
        extraBefore: [() => toggleIsPrettyName(true)],
      });

      expect(getTitle(container)).toBe('Parameters');

      const row = queryRowByLabel(container, 'Original node name:');
      expect(getRowValues(row)).toEqual(['parameters']);
    });
  });

  describe('Task nodes', () => {
    it('shows the code toggle for task nodes with code', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      expect(container.querySelectorAll('.pipeline-toggle').length).toBe(1);
    });

    it('shows the node type as an icon', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      const icon = container.querySelector('.pipeline-metadata__icon');
      expect(icon.classList.contains('pipeline-node-icon--icon-task')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      expect(getTitle(container)).toBe('split_data_node');
    });

    it('shows the node type as text', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      const row = queryRowByLabel(container, 'Type:');
      expect(getRowValues(row)).toEqual(['node']);
    });

    it('does not display the node parameter row when there are no parameters', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: { ...nodeTask, parameters: {} },
      });
      const row = queryRowByLabel(container, 'Parameters:');
      expect(getRowValues(row)).toEqual([]);
    });

    it('shows the node parameters when there are parameters', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      const row = queryRowByLabel(container, 'Parameters:');
      const value = row?.querySelector('.pipeline-json__object')?.textContent;
      expect(value).toContain('3 items');
    });

    it('shows the node inputs', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      const row = queryRowByLabel(container, 'Inputs:');
      expect(getRowValues(row)).toEqual(['Model Input Table', 'Parameters']);
    });

    it('shows the node outputs', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      const row = queryRowByLabel(container, 'Outputs:');
      expect(getRowValues(row)).toEqual([
        'X Train',
        'X Test',
        'Y Train',
        'Y Test',
      ]);
    });

    it('shows the node tags', () => {
      const { container } = renderWithState({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
      });
      const row = queryRowByLabel(container, 'Tags:');
      expect(getRowValues(row)).toEqual(['Split']);
    });

    describe('when there is no runCommand returned by the backend', () => {
      it('should show a help message asking user to provide a name property', () => {
        const mockMetadata = { ...nodeTask };
        mockMetadata['run_command'] = null;
        const { container } = renderWithState({
          nodeId: splitDataTaskNodeId,
          mockMetadata,
        });
        const row = queryRowByLabel(container, 'Run Command:');
        expect(getRowValues(row)).toEqual([
          'Please provide a name argument for this node in order to see a run command.',
        ]);
      });
    });

    describe('when there is a runCommand returned by the backend', () => {
      it('shows the node run command', () => {
        const { container } = renderWithState({
          nodeId: splitDataTaskNodeId,
          mockMetadata: nodeTask,
        });
        const row = queryRowByLabel(container, 'Run Command:');
        expect(getRowValues(row)).toEqual([
          'kedro run --to-nodes=split_data_node',
        ]);
      });

      it('copies run command when button clicked', async () => {
        const clipboardMock = { writeText: jest.fn() };
        Object.assign(navigator, { clipboard: clipboardMock });

        const { container } = renderWithState({
          nodeId: splitDataTaskNodeId,
          mockMetadata: nodeTask,
        });

        const copyBtn = container.querySelector('button.copy-button');
        copyBtn.click();

        expect(clipboardMock.writeText).toHaveBeenCalledWith(
          'kedro run --to-nodes=split_data_node'
        );
      });
    });
  });

  describe('Dataset nodes', () => {
    it('shows the node type as an icon', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });
      const icon = container.querySelector('.pipeline-metadata__icon');
      expect(icon.classList.contains('pipeline-node-icon--icon-data')).toBe(
        true
      );
    });

    it('shows the node name as the title', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });
      expect(getTitle(container)).toBe('model_input_table');
    });

    it('shows the node type as text', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });
      const row = queryRowByLabel(container, 'Type:');
      expect(getRowValues(row)).toEqual(['dataset']);
    });

    it('shows the node dataset type', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });
      const row = queryRowByLabel(container, 'Dataset Type:');
      expect(getRowValues(row)).toEqual(['pandas.CSVDataset']);
    });

    it('shows the node filepath', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });
      const row = queryRowByLabel(container, 'File Path:');
      expect(getRowValues(row)).toEqual([
        'tmp/project/data/03_primary/model_input_table.csv',
      ]);
    });

    it('wont show any tags as they should only appear if the type is nodeTask', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });
      const row = queryRowByLabel(container, 'Tags:');
      expect(row).toBeNull();
    });

    it('shows the node run command', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });
      const row = queryRowByLabel(container, 'Run Command:');
      expect(getRowValues(row)).toEqual([
        'kedro run --to-outputs=model_input_table',
      ]);
    });

    it('copies run command when button clicked', async () => {
      Object.assign(navigator, { clipboard: { writeText: jest.fn() } });

      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
      });

      clickCopyButton(container);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'kedro run --to-outputs=model_input_table'
      );
    });

    it('shows the node statistics', () => {
      const { container } = renderWithState({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeDataStats,
      });

      expect(
        container.querySelector('[data-label="Dataset statistics:"]')
      ).toBeTruthy();
      expect(
        container.querySelector('[data-test="metadata-stats-label-rows"]')
      ).toBeTruthy();
      expect(
        container.querySelector('[data-test="metadata-stats-label-columns"]')
      ).toBeTruthy();
      expect(
        container.querySelector('[data-test="metadata-stats-label-file_size"]')
      ).toBeTruthy();

      expect(
        parseInt(
          container.querySelector('[data-test="metadata-stats-value-rows"]')
            .textContent
        )
      ).toEqual(nodeDataStats.stats.rows);
      expect(
        parseInt(
          container.querySelector('[data-test="metadata-stats-value-columns"]')
            .textContent
        )
      ).toEqual(nodeDataStats.stats.columns);
      expect(
        container.querySelector('[data-test="metadata-stats-value-file_size"]')
          .textContent
      ).toEqual(formatFileSize(nodeDataStats.stats.file_size));
    });

    describe('Transcoded dataset nodes', () => {
      it('shows the node original type', () => {
        const { container } = renderWithState({
          nodeId: modelInputDatasetNodeId,
          mockMetadata: nodeTranscodedData,
        });
        const row = queryRowByLabel(container, 'Original Type:');
        expect(getRowValues(row)).toEqual(['spark.SparkDataset']);
      });

      it('shows the node transcoded type', () => {
        const { container } = renderWithState({
          nodeId: modelInputDatasetNodeId,
          mockMetadata: nodeTranscodedData,
        });
        const row = queryRowByLabel(container, 'Transcoded Types:');
        expect(getRowValues(row)).toEqual(['pandas.ParquetDataset']);
      });
    });

    describe('Plot nodes', () => {
      it('shows the plotly chart', () => {
        const { container } = renderWithState({
          nodeId: modelInputDatasetNodeId,
          mockMetadata: nodePlot,
        });
        expect(
          container.querySelectorAll('.pipeline-metadata__plot').length
        ).toBe(1);
      });

      it('shows the plotly expand button', () => {
        const { container } = renderWithState({
          nodeId: modelInputDatasetNodeId,
          mockMetadata: nodePlot,
        });
        expect(
          container.querySelectorAll('.pipeline-metadata__link').length
        ).toBe(1);
      });
    });
  });

  describe('Parameter nodes', () => {
    it('shows the node type as an icon', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
      });

      const icon = container.querySelector(
        '.pipeline-node-icon--icon-parameters'
      );
      expect(icon).toBeTruthy();
    });

    it('shows the node name as the title', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
      });

      const title = container.querySelector('.pipeline-metadata__title');
      expect(title?.textContent.trim()).toBe('parameters');
    });

    it('shows the node type as text', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
      });

      const row = container.querySelector('[data-label="Type:"]');
      const value = row?.querySelector('.pipeline-metadata__value');
      expect(value?.textContent.trim()).toBe('parameters');
    });

    it('shows the node filepath', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
      });

      const row = container.querySelector('[data-label="File Path:"]');
      const value = row?.querySelector('.pipeline-metadata__value');
      expect(value?.textContent.trim()).toBe('N/A');
    });

    it('shows the first line (number of parameters) displayed in JSON viewer', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
      });

      const row = container.querySelector('[data-label="Parameters:"]');
      const jsonSummary = row?.querySelector(
        '.pipeline-json__object'
      )?.textContent;
      expect(jsonSummary).toContain('3 items');
    });

    it('wont show any tags as they should only appear if the type is nodeTask', () => {
      const { container } = renderWithState({
        nodeId: parametersNodeId,
        mockMetadata: nodeParameters,
      });

      const row = container.querySelector('[data-label="Tags:"]');
      expect(row).toBeNull();
    });
  });
});
