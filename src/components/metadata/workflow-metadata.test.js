import React from 'react';
import MetaData from './metadata';
import { toggleNodeClicked, addNodeMetadata } from '../../actions/nodes';
import { toggleModularPipelinesExpanded } from '../../actions/modular-pipelines';
import { setup, prepareState } from '../../utils/state.mock';
import { VIEW } from '../../config';
import nodeTask from '../../utils/data/node_task.mock.json';
import nodeData from '../../utils/data/node_data.mock.json';
import spaceflights from '../../utils/data/spaceflights.mock.json';

const modelInputDatasetNodeId = '23c94afb';
const splitDataTaskNodeId = '65d0d789';
const dataScienceNodeId = 'data_science';
const dataProcessingNodeId = 'data_processing';

const queryRowByLabel = (container, label) =>
  container.querySelector(`.pipeline-metadata__row[data-label="${label}"]`);

describe('MetaData - Workflow View', () => {
  const mockNodeError = {
    message: 'Node execution failed',
    traceback: 'Traceback details...',
  };

  const mockDatasetError = {
    message: 'Dataset not found',
    type: 'DatasetNotFoundError',
  };

  const renderWithWorkflowView = ({
    nodeId,
    mockMetadata,
    hasError = false,
    isDataset = false,
  }) => {
    const metadata = hasError ? { ...mockMetadata, id: nodeId } : mockMetadata;

    const stateOverrides = {
      view: VIEW.WORKFLOW,
      runStatus: hasError
        ? {
            nodes: isDataset
              ? {}
              : {
                  [nodeId]: { error: mockNodeError },
                },
            datasets: isDataset
              ? {
                  [nodeId]: { error: mockDatasetError },
                }
              : {},
            pipeline: {},
          }
        : {
            nodes: {},
            datasets: {},
            pipeline: {},
          },
    };

    return setup.render(<MetaData visible={true} />, {
      state: {
        ...prepareState({
          beforeLayoutActions: [
            () =>
              toggleModularPipelinesExpanded([
                dataScienceNodeId,
                dataProcessingNodeId,
              ]),
          ],
          data: spaceflights,
          afterLayoutActions: [
            () => toggleNodeClicked(nodeId),
            () => addNodeMetadata({ id: nodeId, data: metadata }),
          ],
        }),
        ...stateOverrides,
      },
    });
  };

  describe('Error handling', () => {
    it('shows error log row for task nodes with errors', () => {
      const { container } = renderWithWorkflowView({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
        hasError: true,
        isDataset: false,
      });

      const errorRow = queryRowByLabel(container, 'Error Log:');
      expect(errorRow).toBeTruthy();
      expect(errorRow.querySelector('.error-log--wrapper')).toBeTruthy();
    });

    it('shows error log row for data nodes with errors', () => {
      const { container } = renderWithWorkflowView({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: nodeData,
        hasError: true,
        isDataset: true,
      });

      const errorRow = queryRowByLabel(container, 'Error Log:');
      expect(errorRow).toBeTruthy();
      expect(errorRow.querySelector('.error-log--wrapper')).toBeTruthy();
    });

    it('does not show error log row when no errors are present', () => {
      const { container } = renderWithWorkflowView({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
        hasError: false,
      });

      const errorRow = queryRowByLabel(container, 'Error Log:');
      expect(errorRow).toBeFalsy();
    });
  });

  describe('UI behavior differences from flowchart view', () => {
    it('does not show code toggle', () => {
      const { container } = renderWithWorkflowView({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
        hasError: false,
      });

      const codeToggle = container.querySelector(
        '[data-test*="metadata-code-toggle"]'
      );
      expect(codeToggle).toBeFalsy();
    });

    it('does not show table preview', () => {
      const { container } = renderWithWorkflowView({
        nodeId: modelInputDatasetNodeId,
        mockMetadata: {
          ...nodeData,
          preview: 'some preview data',
          previewType: 'TablePreview',
        },
        hasError: false,
      });

      const preview = container.querySelector('.pipeline-metadata__preview');
      expect(preview).toBeFalsy();
    });

    it('maintains workflow view specific behavior', () => {
      const { container } = renderWithWorkflowView({
        nodeId: splitDataTaskNodeId,
        mockMetadata: nodeTask,
        hasError: false,
      });

      // Verify workflow view is active by checking absence of flowchart-specific elements
      const codeToggle = container.querySelector(
        '[data-test*="metadata-code-toggle"]'
      );
      expect(codeToggle).toBeFalsy();
    });
  });
});
