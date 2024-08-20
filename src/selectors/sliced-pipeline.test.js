import { mockState } from '../utils/state.mock';
import reducer from '../reducers';

import { SET_SLICE_PIPELINE } from '../actions/slice';
import { getSlicedPipeline } from './sliced-pipeline';

describe('Selectors', () => {
  it('return a filteredPipeline array with any node in between', () => {
    const fromNode = '47b81aa6';
    const toNode = '23c94afb';

    const expected = ['23c94afb', '47b81aa6', 'data_processing'];
    const newState = reducer(mockState.spaceflights, {
      type: SET_SLICE_PIPELINE,
      slice: { from: fromNode, to: toNode },
    });

    const res = getSlicedPipeline(newState);
    expect(res).toEqual(expected);
  });

  it('return only fromNode and toNode if they are not connected', () => {
    const fromNode = '47b81aa6';
    const toNode = 'f1f1425b';

    const newState = reducer(mockState.spaceflights, {
      type: SET_SLICE_PIPELINE,
      slice: { from: fromNode, to: toNode },
    });

    const res = getSlicedPipeline(newState);
    expect(res).toEqual([fromNode, toNode]);
  });
});
