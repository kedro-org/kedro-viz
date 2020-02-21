import { createSelector } from 'reselect';

const getNodeTypeIDs = state => state.nodeType.ids;
const getNodeTypeName = state => state.nodeType.name;
const getNodeTypeDisabled = state => state.nodeType.disabled;

/**
 * Get formatted list of node type objects
 */
export const getNodeTypes = createSelector(
  [getNodeTypeIDs, getNodeTypeName, getNodeTypeDisabled],
  (types, typeName, typeDisabled) =>
    types.map(id => ({
      id,
      name: typeName[id],
      disabled: Boolean(typeDisabled[id])
    }))
);
