import normalizeData from './normalize-data';
import { getInitialPipelineState } from '../store/initial-state';
import animals from '../utils/data/animals.mock';

const initialState = getInitialPipelineState();

describe('normalizeData', () => {
  it('should return initialState if input is invalid', () => {
    expect(normalizeData(undefined)).toEqual(initialState);
    expect(normalizeData(null)).toEqual(initialState);
    expect(normalizeData('json')).toEqual(initialState);
    expect(normalizeData({})).toEqual(initialState);
    expect(normalizeData({ nodes: null, edges: 100 })).toEqual(initialState);
  });

  it('should not add tags if tags are not supplied', () => {
    const data = Object.assign({}, animals, { tags: undefined });
    data.nodes.forEach(node => {
      delete node.tags;
    });
    expect(normalizeData(data).tag.ids).toHaveLength(0);
  });

  it('should not add pipelines if pipelines are not supplied', () => {
    const data = Object.assign({}, animals, { pipelines: undefined });
    data.nodes.forEach(node => {
      delete node.pipelines;
    });
    expect(normalizeData(data).pipeline.ids).toHaveLength(0);
  });

  it('should not add an active pipeline if pipelines.length is 0', () => {
    const data = Object.assign({}, animals, { pipelines: [] });
    data.nodes.forEach(node => {
      node.pipelines = [];
    });
    expect(normalizeData(data).pipeline.active).toBe(null);
  });

  it('should not add layers if layers are not supplied', () => {
    const data = Object.assign({}, animals, { layers: undefined });
    data.nodes.forEach(node => {
      delete node.layer;
    });
    expect(normalizeData(data).layer.ids).toHaveLength(0);
  });

  it('should not add duplicate nodes', () => {
    const data = Object.assign({}, animals);
    data.nodes.push(data.nodes[0]);
    data.nodes.push(data.nodes[1]);
    data.nodes.push(data.nodes[2]);
    expect(normalizeData(data).node.ids.length).toEqual(
      normalizeData(animals).node.ids.length
    );
  });

  it('should fall back to node.name if node.full_name is not supplied', () => {
    const data = Object.assign({}, animals);
    data.nodes.forEach(node => {
      node.name = node.name + '-name';
      delete node.full_name;
    });
    const state = normalizeData(data);
    expect(
      state.node.ids.every(
        nodeID => state.node.fullName[nodeID] === state.node.name[nodeID]
      )
    ).toBe(true);
  });
});
