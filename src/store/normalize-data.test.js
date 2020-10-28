import normalizeData, {
  createInitialPipelineState,
  normalizeFetchedNodeData
} from './normalize-data';
import animals from '../utils/data/animals.mock.json';
import node_parameters from '../utils/data/node_parameters.json';
import node_task from '../utils/data/node_task.json';

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
      asyncDataSource: true
    });
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
    expect(normalizeData(data).pipeline.active).toBe(undefined);
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

describe('normalizeFetchedNodeData', () => {
  it('should throw an error when received data from API is empty or false', () => {
    const node = { id: 'abc123' };
    expect(() => normalizeFetchedNodeData(undefined, node)).toThrow();
    expect(() => normalizeData(null, node)).toThrow();
    expect(() => normalizeData(false, node)).toThrow();
  });

  it('should update the relevant fields of the state with node task data type', () => {
    const node = { id: 'abc123', type: 'task' };
    const state = normalizeFetchedNodeData(node_task, node);
    expect(state.pipeline.node.code[node.id]).toEqual(node_task.code);
    expect(state.pipeline.node.codeLocation[node.id]).toEqual(
      node_task.codeLocation
    );
    expect(state.pipeline.node.docString[node.id]).toEqual(node_task.docString);
  });

  it('should update the relevant fields of the state with node parameters data type', () => {
    const node = { id: 'abc123', type: 'parameters' };
    const state = normalizeFetchedNodeData(node_parameters, node);
    expect(state.pipeline.node.parameters[node.id]).toEqual(
      node_parameters.parameters
    );
  });
});
