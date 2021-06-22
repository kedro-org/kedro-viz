import {
  TOGGLE_TYPE_DISABLED,
  NODE_TYPE_DISABLED_UNSET,
} from '../actions/node-type';

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
      const typeDisabledState = {
        ...nodeTypeState.disabled,
        ...action.typeIDs,
      };
      
      const typeDisabledStateValues = Object.values(typeDisabledState);

      // If all types would now be disabled
      if (typeDisabledStateValues.every(isNodeTypeDisabled)) {
        // Reset all types back to unset
        return {
          ...nodeTypeState,
          disabled: { ...allNodeTypesUnset },
        };
      }

      // Otherwise if there is now at least one enabled type
      if (typeDisabledStateValues.some(isNodeTypeEnabled)) {
        for (const type in typeDisabledState) {
          typeDisabledState[type] =
            // Disable all the unset types
            isNodeTypeUnset(typeDisabledState[type])
              ? true
              : typeDisabledState[type];
        }
      }

      return {
        ...nodeTypeState,
        disabled: typeDisabledState,
      };
    }
    default:
      return nodeTypeState;
  }
}

export default nodeTypeReducer;
