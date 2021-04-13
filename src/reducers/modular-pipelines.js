import { TOGGLE_MODULAR_PIPELINE_CONTRACTED } from '../actions';

function modularPipelineReducer(modularPipelineState = {}, action) {
  switch (action.type) {
    case TOGGLE_MODULAR_PIPELINE_CONTRACTED: {
      return Object.assign({}, modularPipelineState, {
        contracted: Object.assign({}, modularPipelineState.contracted, {
          [action.modularPipelineID]: action.contracted,
        }),
      });
    }

    default:
      return modularPipelineState;
  }
}

export default modularPipelineReducer;
