import normalizeData from './normalize-data';
import { initialState } from './initial-state';
import animals from '../utils/data/animals.mock.json';

describe('normalizeData', () => {
  it('should throw an error when data prop is empty or false', () => {
    expect(() => normalizeData(initialState, undefined)).toThrow();
    expect(() => normalizeData(initialState, null)).toThrow();
    expect(() => normalizeData(initialState, false)).toThrow();
  });

  it('should return initialState if input is invalid', () => {
    expect(() => normalizeData(initialState, {})).toThrow();
    expect(() =>
      normalizeData(initialState, { nodes: null, edges: {} })
    ).toThrow();
    expect(() =>
      normalizeData(initialState, { nodes: true, edges: 100 })
    ).toThrow();
  });

  it('should return initialState if input is "json"', () => {
    expect(normalizeData(initialState, 'json')).toEqual({
      ...initialState,
      dataSource: 'json',
    });
  });

  it('should return a clone of initialState and not mutate the original object', () => {
    expect(normalizeData(initialState, animals)).not.toBe(initialState);
  });

  it('should not add tags if tags are not supplied', () => {
    const data = Object.assign({}, animals, { tags: undefined });
    data.nodes.forEach((node) => {
      delete node.tags;
    });
    expect(normalizeData(initialState, data).tag.ids).toHaveLength(0);
  });

  it('should not add pipelines if pipelines are not supplied', () => {
    const data = Object.assign({}, animals, { pipelines: undefined });
    data.nodes.forEach((node) => {
      delete node.pipelines;
    });
    expect(normalizeData(initialState, data).pipeline.ids).toHaveLength(0);
  });

  it('should not add an active pipeline if pipelines.length is 0', () => {
    const data = Object.assign({}, animals, { pipelines: [] });
    data.nodes.forEach((node) => {
      node.pipelines = [];
    });
    expect(normalizeData(initialState, data).pipeline.active).toBe(undefined);
  });

  it('should not add modular pipelines if modular pipelines are not supplied', () => {
    const data = Object.assign({}, animals, { modular_pipelines: undefined });
    expect(normalizeData(initialState, data).modularPipeline.ids).toHaveLength(
      0
    );
  });

  it('should not add duplicate modular pipelines', () => {
    const data = Object.assign({}, animals, {
      modular_pipelines: [
        {
          id: 'pipeline1',
          name: 'Pipeline 1',
        },
        {
          id: 'pipeline1',
          name: 'Pipeline 1',
        },
      ],
    });
    expect(normalizeData(initialState, data).modularPipeline.ids).toHaveLength(
      1
    );
  });

  it('should not add layers if layers are not supplied', () => {
    const data = Object.assign({}, animals, { layers: undefined });
    data.nodes.forEach((node) => {
      delete node.layer;
    });
    expect(normalizeData(initialState, data).layer.ids).toHaveLength(0);
  });

  it('should not add duplicate nodes', () => {
    const { nodes } = animals;
    const data = Object.assign({}, animals, {
      nodes: [...nodes, nodes[0], nodes[1], nodes[2]],
    });
    expect(normalizeData(initialState, data).node.ids.length).toEqual(
      normalizeData(initialState, animals).node.ids.length
    );
  });

  it('should fall back to node.name if node.full_name is not supplied', () => {
    const data = Object.assign({}, animals);
    data.nodes.forEach((node) => {
      node.name = node.name + '-name';
      delete node.full_name;
    });
    const state = normalizeData(initialState, data);
    expect(
      state.node.ids.every(
        (nodeID) => state.node.fullName[nodeID] === state.node.name[nodeID]
      )
    ).toBe(true);
  });

  it('sets pipeline.main to be data.selected_pipeline', () => {
    const state = normalizeData(initialState, animals);
    expect(state.pipeline.main).toBe(animals.selected_pipeline);
  });

  it('sets pipeline.main to the first pipeline in the list if selected_pipeline is not supplied', () => {
    const data = Object.assign({}, animals);
    delete data.selected_pipeline;
    const state = normalizeData(initialState, data);
    expect(state.pipeline.main).toBe(animals.pipelines[0].id);
  });

  it('sets main pipeline as active if active pipeline from localStorage is not one of the pipelines in the current list', () => {
    const state = normalizeData(
      {
        ...initialState,
        pipeline: {
          ...initialState.pipeline,
          active: 'unknown pipeline id',
        },
      },
      animals
    );
    expect(state.pipeline.active).toBe(animals.selected_pipeline);
  });
});
