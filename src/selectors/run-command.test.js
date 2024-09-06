import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getRunCommand } from './run-command';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Kedro command generation', () => {
  it('should generate a kedro run command with specified from and to nodes', () => {
    // Define node IDs for from and to nodes
    const fromNodeId = '47b81aa6';
    const toNodeId = '65d0d789';

    const expectedToNodeName = 'data_processing.companies';
    const expectedCommand = `kedro run --to-outputs=${expectedToNodeName}`;

    // Initial state with run commands for nodes
    const initialState = {
      node: {
        runCommand: {
          '65d0d789': 'kedro run --to-outputs=data_processing.companies',
          '47b81aa6': 'kedro run --to-nodes=create_model_input_table_node',
        },
      },
      slice: {
        from: fromNodeId,
        to: toNodeId,
      },
    };

    // Create a mock store with the initial state
    const store = mockStore(initialState);
    const newState = store.getState();
    const generatedCommand = getRunCommand(newState);

    expect(generatedCommand).toEqual(expectedCommand);
  });
});
