import normalizeData, { createInitialPipelineState } from './normalize-data';
import spaceflights from '../utils/data/spaceflights.mock.json';

const initialState = createInitialPipelineState();

describe('normalizeData', () => {
  it('should throw an error when data prop is empty or false', () => {
    expect(() => normalizeData(undefined)).toThrow();
    expect(() => normalizeData(null)).toThrow();
    expect(() => normalizeData(false)).toThrow();
  });

  it('should return initialState if input is invalid', () => {
    expect(() => normalizeData({})).toThrow();
    expect(() => normalizeData({ nodes: null, edges: {} })).toThrow();
    expect(() => normalizeData({ nodes: true, edges: 100 })).toThrow();
  });

  it('should return initialState if input is "json"', () => {
    expect(normalizeData('json')).toEqual({
      ...initialState,
      dataSource: 'json',
    });
  });

  it('should not add tags if tags are not supplied', () => {
    const data = Object.assign({}, spaceflights, { tags: undefined });
    data.nodes.forEach((node) => {
      delete node.tags;
    });
    expect(normalizeData(data).tag.ids).toHaveLength(0);
  });

  it('should not add pipelines if pipelines are not supplied', () => {
    const data = Object.assign({}, spaceflights, { pipelines: undefined });
    data.nodes.forEach((node) => {
      delete node.pipelines;
    });
    expect(normalizeData(data).pipeline.ids).toHaveLength(0);
  });

  it('should not add an active pipeline if pipelines.length is 0', () => {
    const data = Object.assign({}, spaceflights, { pipelines: [] });
    data.nodes.forEach((node) => {
      node.pipelines = [];
    });
    expect(normalizeData(data).pipeline.active).toBe(undefined);
  });

  it('should not add modular pipelines if modular pipelines are not supplied', () => {
    const data = Object.assign(
      {},
      spaceflights,
      //eslint-disable-next-line camelcase
      { modular_pipelines: undefined }
    );
    expect(normalizeData(data).modularPipeline.ids).toHaveLength(0);
  });

  it('should not add duplicate modular pipelines', () => {
    const data = Object.assign({}, spaceflights, {
      //eslint-disable-next-line camelcase
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
    expect(normalizeData(data).modularPipeline.ids).toHaveLength(1);
  });

  it('should not add layers if layers are not supplied', () => {
    const data = Object.assign({}, spaceflights, { layers: undefined });
    data.nodes.forEach((node) => {
      delete node.layer;
    });
    expect(normalizeData(data).layer.ids).toHaveLength(0);
  });

  it('should not add duplicate nodes', () => {
    const data = Object.assign({}, spaceflights);
    data.nodes.push(data.nodes[0]);
    data.nodes.push(data.nodes[1]);
    data.nodes.push(data.nodes[2]);
    expect(normalizeData(data).node.ids.length).toEqual(
      normalizeData(spaceflights).node.ids.length
    );
  });

  it('should fall back to node.name if node.full_name is not supplied', () => {
    const data = Object.assign({}, spaceflights);
    data.nodes.forEach((node) => {
      node.name = node.name + '-name';
      delete node.full_name;
    });
    const state = normalizeData(data);
    expect(
      state.node.ids.every(
        (nodeID) => state.node.fullName[nodeID] === state.node.name[nodeID]
      )
    ).toBe(true);
  });
});
