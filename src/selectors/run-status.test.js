import {
  getDatasetsStatus,
  getNodesStatus,
  isRunStatusAvailable,
  getPipelineRunData,
  getNodeError,
  getDatasetError,
} from './run-status';

describe('Run Status Selectors', () => {
  const mockRunStatusState = {
    runStatus: {
      nodes: {
        '69c523b6': {
          status: 'success',
          duration: 0.02171195892151445,
          error: null,
        },
        ea604da4: {
          status: 'failed',
          duration: 0.031324208015576005,
          error: {
            message: 'Node execution failed',
            traceback: 'Traceback details...',
          },
        },
      },
      datasets: {
        aed46479: {
          name: 'companies',
          size: 1810602,
          status: 'success',
          error: null,
        },
        f23ad217: {
          name: 'reviews',
          size: 2937144,
          status: 'failed',
          error: {
            message: 'Dataset not found',
            type: 'DatasetNotFoundError',
          },
        },
      },
      pipeline: {
        runId: '6d962877-1fdf-4b9a-b953-3377f476d48e',
        startTime: '2025-06-18T12.10.44.342274Z',
        endTime: '2025-06-18T12.11.09.584093Z',
        duration: 12.730948126059957,
        status: 'success',
        error: null,
      },
    },
  };

  const emptyState = {
    runStatus: {
      nodes: {},
      datasets: {},
      pipeline: {
        runId: 'default-run-id',
      },
    },
  };

  describe('getDatasetsStatus', () => {
    it('groups datasets by success and failed status based on error property', () => {
      const result = getDatasetsStatus(mockRunStatusState);

      expect(result).toEqual({
        success: {
          aed46479: {
            name: 'companies',
            size: 1810602,
            status: 'success',
            error: null,
          },
        },
        failed: {
          f23ad217: {
            name: 'reviews',
            size: 2937144,
            status: 'failed',
            error: {
              message: 'Dataset not found',
              type: 'DatasetNotFoundError',
            },
          },
        },
      });
    });

    it('returns empty success and failed objects when no datasets', () => {
      const result = getDatasetsStatus(emptyState);

      expect(result).toEqual({
        success: {},
        failed: {},
      });
    });
  });

  describe('getNodesStatus', () => {
    it('groups nodes by success and failed status based on error property', () => {
      const result = getNodesStatus(mockRunStatusState);

      expect(result).toEqual({
        success: {
          '69c523b6': {
            status: 'success',
            duration: 0.02171195892151445,
            error: null,
          },
        },
        failed: {
          ea604da4: {
            status: 'failed',
            duration: 0.031324208015576005,
            error: {
              message: 'Node execution failed',
              traceback: 'Traceback details...',
            },
          },
        },
      });
    });

    it('returns empty success and failed objects when no nodes', () => {
      const result = getNodesStatus(emptyState);

      expect(result).toEqual({
        success: {},
        failed: {},
      });
    });
  });

  describe('isRunStatusAvailable', () => {
    it('returns true when run status data is available with valid run ID', () => {
      const result = isRunStatusAvailable(mockRunStatusState);
      expect(result).toBe(true);
    });

    it('returns false when run ID is default', () => {
      const result = isRunStatusAvailable(emptyState);
      expect(result).toBe(false);
    });

    it('returns true when only nodes are present with valid run ID', () => {
      const stateWithOnlyNodes = {
        runStatus: {
          nodes: { '69c523b6': { status: 'success' } },
          datasets: {},
          pipeline: {
            runId: '6d962877-1fdf-4b9a-b953-3377f476d48e',
          },
        },
      };

      const result = isRunStatusAvailable(stateWithOnlyNodes);
      expect(result).toBe(true);
    });
  });

  describe('getPipelineRunData', () => {
    it('returns pipeline run metadata', () => {
      const result = getPipelineRunData(mockRunStatusState);

      expect(result).toEqual({
        runId: '6d962877-1fdf-4b9a-b953-3377f476d48e',
        startTime: '2025-06-18T12.10.44.342274Z',
        endTime: '2025-06-18T12.11.09.584093Z',
        duration: 12.730948126059957,
        status: 'success',
        error: null,
      });
    });

    it('returns empty object when pipeline data is missing', () => {
      const stateWithoutPipeline = {
        runStatus: {
          nodes: {},
          datasets: {},
        },
      };

      const result = getPipelineRunData(stateWithoutPipeline);
      expect(result).toEqual({});
    });
  });

  describe('getNodeError', () => {
    it('returns error details for a failed node', () => {
      const result = getNodeError(mockRunStatusState, 'ea604da4');

      expect(result).toEqual({
        message: 'Node execution failed',
        traceback: 'Traceback details...',
      });
    });

    it('returns null for a successful node', () => {
      const result = getNodeError(mockRunStatusState, '69c523b6');
      expect(result).toBeNull();
    });
  });

  describe('getDatasetError', () => {
    it('returns error details for a failed dataset', () => {
      const result = getDatasetError(mockRunStatusState, 'f23ad217');

      expect(result).toEqual({
        message: 'Dataset not found',
        type: 'DatasetNotFoundError',
      });
    });

    it('returns null for a successful dataset', () => {
      const result = getDatasetError(mockRunStatusState, 'aed46479');
      expect(result).toBeNull();
    });
  });
});
