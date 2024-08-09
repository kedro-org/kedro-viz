import { mockState } from '../utils/state.mock';
import reducer from '../reducers';

import { SLICE_PIPELINE } from '../actions/slice';
import { getRunCommand } from './run-command';

describe('Selectors', () => {
  it('should generate a kedro run command with specified from and to nodes', () => {
    const fromNodeId = '47b81aa6';
    const toNodeId = '23c94afb';

    const expectedFromNodeName = ['create_model_input_table_node'];
    const expectedToNodeName = ['model_input_table'];
    const expectedCommand = `kedro run --from-nodes=${expectedFromNodeName} --to-nodes=${expectedToNodeName}`;

    const newState = reducer(mockState.spaceflights, {
      type: SLICE_PIPELINE,
      slice: { from: fromNodeId, to: toNodeId },
    });

    const generatedCommand = getRunCommand(newState);

    expect(generatedCommand).toEqual(expectedCommand);
  });
});
