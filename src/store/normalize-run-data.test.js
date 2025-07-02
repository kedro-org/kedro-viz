import normalizeRunStatusData, {
  createInitialRunStatusState,
  normalizeTimestamp,
  processRunStatus,
} from './normalize-run-data';

describe('createInitialRunStatusState', () => {
  it('returns an object with the correct structure', () => {
    const state = createInitialRunStatusState();
    expect(state).toEqual({
      nodes: {},
      datasets: {},
      pipeline: {},
    });
  });
});

describe('normalizeTimestamp', () => {
  it('returns undefined for falsy values', () => {
    expect(normalizeTimestamp(null)).toBeUndefined();
    expect(normalizeTimestamp('')).toBeUndefined();
  });

  it('converts dots to colons and adds UTC timezone', () => {
    expect(normalizeTimestamp('2023-01-01T09.54.33')).toBe(
      '2023-01-01T09:54:33Z'
    );
  });

  it('preserves existing timezone information', () => {
    expect(normalizeTimestamp('2023-01-01T10:00:00Z')).toBe(
      '2023-01-01T10:00:00Z'
    );
    expect(normalizeTimestamp('2023-01-01T10:00:00+05:00')).toBe(
      '2023-01-01T10:00:00+05:00'
    );
  });
});

describe('processRunStatus', () => {
  it('processes run status data correctly', () => {
    const data = {
      nodes: {
        node1: { status: 'success', duration: 1.5, error: null },
      },
      datasets: {
        dataset1: {
          name: 'Test Dataset',
          size: 1024,
          status: 'available',
          error: null,
        },
      },
      pipeline: {
        // eslint-disable-next-line camelcase
        run_id: 'test-run-123',
        // eslint-disable-next-line camelcase
        start_time: '2023-01-01T10.00.00',
        // eslint-disable-next-line camelcase
        end_time: '2023-01-01T10.05.30',
        duration: 330,
        status: 'completed',
        error: null,
      },
    };

    const result = processRunStatus(data);

    expect(result.nodes.node1).toEqual({
      status: 'success',
      duration: 1.5,
      error: null,
    });
    expect(result.datasets.dataset1).toEqual({
      name: 'Test Dataset',
      size: 1024,
      status: 'available',
      error: null,
    });
    expect(result.pipeline).toEqual({
      runId: 'test-run-123',
      startTime: '2023-01-01T10:00:00Z',
      endTime: '2023-01-01T10:05:30Z',
      duration: 330,
      status: 'completed',
      error: null,
    });
  });
});

describe('normalizeRunStatusData', () => {
  it('should throw an error when data is invalid', () => {
    expect(() => normalizeRunStatusData({})).toThrow();
    expect(() => normalizeRunStatusData({ nodes: [] })).toThrow();
  });

  it('returns initial state for falsy input', () => {
    const result = normalizeRunStatusData(null);
    expect(result).toEqual(createInitialRunStatusState());
  });

  it('processes valid run status data correctly', () => {
    const data = {
      nodes: {
        node1: { status: 'success', duration: 2.1 },
      },
      datasets: {
        dataset1: { name: 'Test Data', size: 512 },
      },
      pipeline: {
        // eslint-disable-next-line camelcase
        run_id: 'run-456',
        // eslint-disable-next-line camelcase
        start_time: '2023-01-01T09.30.00',
        status: 'completed',
      },
    };

    const result = normalizeRunStatusData(data);

    expect(result.nodes.node1).toEqual({ status: 'success', duration: 2.1 });
    expect(result.datasets.dataset1).toEqual({ name: 'Test Data', size: 512 });
    expect(result.pipeline.runId).toBe('run-456');
    expect(result.pipeline.startTime).toBe('2023-01-01T09:30:00Z');
  });
});
