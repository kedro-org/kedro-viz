import { createSelector } from 'reselect';

const getTypes = state => state.types;
const getTypeName = state => state.typeName;
const getTypeDisabled = state => state.typeDisabled;

/**
 * Get formatted list of node type objects
 */
export const getNodeTypes = createSelector(
  [getTypes, getTypeName, getTypeDisabled],
  (types, typeName, typeDisabled) =>
    types.map(id => ({
      id,
      name: typeName[id],
      disabled: Boolean(typeDisabled[id])
    }))
);
