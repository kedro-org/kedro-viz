import { createSelector } from 'reselect';
import { getNodeDisabled } from './disabled';
import { arrayToObject } from '../utils';

const getNodeIDs = state => state.node.ids;
const getNodeType = state => state.node.type;
const getNodeTypeIDs = state => state.nodeType.ids;
const getNodeTypeName = state => state.nodeType.name;
const getNodeTypeDisabled = state => state.nodeType.disabled;
const getNodeTypeSections = state => state.nodeType.section;

/**
 * Calculate the total number of nodes (and the number of visible nodes)
 * for each node-type
 */
export const getTypeNodeCount = createSelector(
  [getNodeTypeIDs, getNodeIDs, getNodeType, getNodeDisabled],
  (types, nodeIDs, nodeType, nodeDisabled) =>
    arrayToObject(types, type => {
      const typeNodeIDs = nodeIDs.filter(nodeID => nodeType[nodeID] === type);
      const visibleTypeNodeIDs = typeNodeIDs.filter(
        nodeID => !nodeDisabled[nodeID]
      );
      return {
        total: typeNodeIDs.length,
        visible: visibleTypeNodeIDs.length
      };
    })
);

/**
 * Get formatted list of node type objects
 */
export const getNodeTypes = createSelector(
  [getNodeTypeIDs, getNodeTypeName, getNodeTypeDisabled, getTypeNodeCount],
  (types, typeName, typeDisabled, typeNodeCount) =>
    types.map(id => ({
      id,
      name: typeName[id],
      disabled: Boolean(typeDisabled[id]),
      nodeCount: typeNodeCount[id]
    }))
);

/**
 * Get formatted list of sections
 */
export const getNodeSections = createSelector(
  [getNodeTypeSections, getNodeTypes],
  (sections, types) => {
    const result = [];
    for (const name of Object.keys(sections)) {
      result.push({
        name,
        types: sections[name].map(id => types.find(type => type.id === id))
      });
    }
    return result;
  }
);
