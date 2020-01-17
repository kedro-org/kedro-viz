import { createSelector } from 'reselect';

const getTypes = state => state.types;
const getTypeName = state => state.typeName;
const getTypeActive = state => state.typeActive;
const getTypeDisabled = state => state.typeDisabled;

/**
 * Get formatted list of node type objects
 */
export const getNodeTypes = createSelector(
  [getTypes, getTypeName, getTypeActive, getTypeDisabled],
  (types, typeName, typeActive, typeDisabled) =>
    types.map(id => ({
      id,
      name: typeName[id],
      active: typeActive[id],
      disabled: typeDisabled[id]
    }))
);
