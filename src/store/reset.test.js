import resetPipelineState from './reset';
import { saveState } from './helpers';
import { mockState, prepareState } from '../utils/state.mock';
import animals from '../utils/data/animals.mock.json';
import { initialState } from './initial-state';

describe('resetPipelineState', () => {
  it('resets pipeline data back to initial state', () => {
    expect(resetPipelineState(mockState.animals)).toMatchObject(initialState);
  });

  it('only resets pipeline-related data', () => {
    expect(
      resetPipelineState({
        theme: 'light',
        visible: { sidebar: true },
        node: { ids: ['one', 'two'] },
      })
    ).toMatchObject({
      theme: 'light',
      visible: { sidebar: true },
      node: { ids: [] },
    });
  });

  it('does not delete localStorage values', () => {
    const active = animals.pipelines.find(
      (pipeline) => pipeline.id !== animals.selected_pipeline
    ).id;
    const localStorageValues = {
      node: { disabled: { foo: true } },
      pipeline: { active },
    };
    saveState(localStorageValues);
    const state = prepareState({ data: animals });
    expect(resetPipelineState(state)).toMatchObject(localStorageValues);
  });
});
