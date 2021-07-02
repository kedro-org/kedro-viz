import {
  TOGGLE_TYPE_DISABLED,
  NODE_TYPE_DISABLED_UNSET,
} from '../actions/node-type';

/**
 * See actions/node-type.js for details on the 'unset' value.
 */
const allNodeTypesUnset = {
  parameters: NODE_TYPE_DISABLED_UNSET,
  task: NODE_TYPE_DISABLED_UNSET,
  data: NODE_TYPE_DISABLED_UNSET,
};

const isNodeTypeUnset = (nodeTypeValue) =>
  nodeTypeValue === NODE_TYPE_DISABLED_UNSET;

const isNodeTypeEnabled = (nodeTypeValue) =>
  isNodeTypeUnset(nodeTypeValue) || nodeTypeValue === false;

const isNodeTypeDisabled = (nodeTypeValue) => nodeTypeValue === true;

function nodeTypeReducer(nodeTypeState = {}, action) {
  switch (action.type) {
    case TOGGLE_TYPE_DISABLED: {
      const nextDisabledState = {
        ...nodeTypeState.disabled,
        ...action.typeIDs,
      };

      const nextTypesDisabled = Object.values(nextDisabledState);

      // If no types will be enabled
      if (nextTypesDisabled.every(isNodeTypeDisabled)) {
        // Then reset all types to unset (defaulting to enabled)
        return {
          ...nodeTypeState,
          disabled: { ...allNodeTypesUnset },
        };
      }

      // Otherwise if there is at least one enabled type
      if (nextTypesDisabled.some(isNodeTypeEnabled)) {
        const nextTypesUnset = nextTypesDisabled.filter((type) =>
          isNodeTypeUnset(nextDisabledState[type])
        );

        // Set any unset types to explicitly disabled
        for (const type in nextTypesUnset) {
          nextDisabledState[type] = true;
        }
      }

      return {
        ...nodeTypeState,
        disabled: nextDisabledState,
      };
    }
    default:
      return nodeTypeState;
  }
}

export default nodeTypeReducer;
