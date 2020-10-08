import { createStore } from 'redux';
import reducer from '../reducers';
import { changeFlag } from './index';
import { mockState } from '../utils/state.mock';
import { saveState } from '../store/helpers';
import {
  updateActivePipeline,
  UPDATE_ACTIVE_PIPELINE,
  toggleLoading,
  TOGGLE_PIPELINE_LOADING,
  getPipelineUrl,
  requiresSecondRequest,
  loadInitialPipelineData,
  loadPipelineData
} from './pipelines';

jest.mock('../store/load-data.js');

// const cases = {
//   pipelineFlagIsDisabled: isTrue => {},
//   isFirstLoad: isTrue => {},
//   isAsync: isTrue => {},
//   hasPipelinesInDataset: isTrue => {},
//   hasLocalStorage: isTrue => ({
//     before: () =>
//       isTrue &&
//       saveState({
//         pipeline: { active: 'de' }
//       }),
//     test: state => {
//       if (isTrue) {
//         expect(state.active).toBe('de');
//       } else {
//         expect(state.active).not.toBe('de');
//       }
//     }
//   }),
//   isMain: isTrue => {},
//   hasUnknownActivePipeline: isTrue => ({
//     before: () =>
//       isTrue &&
//       saveState({
//         pipeline: { active: 'unknown' }
//       }),
//     test: state => {
//       expect(state.active).toBe('__default__');
//     }
//   })
// };

// const caseCount = Object.keys(cases).length;
// const combinations = [];
// for (let i = 0; i < Math.pow(2, caseCount); i++) {
//   const combination = i
//     .toString(2)
//     .padStart(caseCount, '0')
//     .split('')
//     .map(d => Boolean(+d));
//   combinations.push(combination);
// }

describe('pipeline actions', () => {
  describe('updateActivePipeline', () => {
    it('should create an action to update the active pipeline', () => {
      const pipeline = 'abc123';
      const expectedAction = {
        type: UPDATE_ACTIVE_PIPELINE,
        pipeline
      };
      expect(updateActivePipeline(pipeline)).toEqual(expectedAction);
    });
  });

  describe('toggleLoading', () => {
    it('should create an action to toggle whether the pipeline is loading', () => {
      const loading = true;
      const expectedAction = {
        type: TOGGLE_PIPELINE_LOADING,
        loading
      };
      expect(toggleLoading(loading)).toEqual(expectedAction);
    });
  });

  describe('getPipelineUrl', () => {
    const id = 'abc123';

    it('should return the "main" endpoint URL if active === default', () => {
      const pipeline = { active: id, default: id };
      expect(getPipelineUrl(pipeline)).toEqual(expect.stringContaining('main'));
    });

    it('should return the "main" endpoint URL if active !== default', () => {
      const pipeline = { active: id, default: '__default__' };
      expect(getPipelineUrl(pipeline)).toEqual(
        expect.stringContaining(`pipelines/${id}`)
      );
    });
  });

  describe('loadInitialPipelineData', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    afterEach(() => {
      window.localStorage.clear();
      window.deletePipelines = undefined;
    });

    describe('if sync', () => {
      it('should return immediately', () => {
        const store = createStore(reducer, mockState.animals);
        loadInitialPipelineData()(store.dispatch, store.getState);
        expect(store.getState().loading.pipeline).toBe(false);
      });
    });

    describe('if async', () => {
      it('should set loading to true immediately', () => {
        const store = createStore(reducer, mockState.json);
        expect(store.getState().loading.pipeline).toBe(false);
        loadInitialPipelineData()(store.dispatch, store.getState);
        expect(store.getState().loading.pipeline).toBe(true);
      });

      it("should reset the active pipeline if its ID isn't included in the list of pipeline IDs", async () => {
        saveState({ pipeline: { active: 'unknown-id' } });
        const store = createStore(reducer, mockState.json);
        await loadInitialPipelineData()(store.dispatch, store.getState);
        const state = store.getState();
        expect(state.pipeline.active).toBe(state.pipeline.default);
        expect(state.node).toEqual(mockState.animals.node);
      });

      it('should request data from a different dataset if the active pipeline is set', async () => {
        const { pipeline } = mockState.animals;
        const active = pipeline.ids.find(id => id !== pipeline.default);
        saveState({ pipeline: { active } });
        const store = createStore(reducer, mockState.json);
        await loadInitialPipelineData()(store.dispatch, store.getState);
        expect(store.getState().pipeline.active).toBe(active);
        expect(store.getState().node).toEqual(mockState.demo.node);
      });

      it("shouldn't make a second data request if the active pipeline is unset", async () => {
        const store = createStore(reducer, mockState.json);
        await loadInitialPipelineData()(store.dispatch, store.getState);
        const state = store.getState();
        expect(state.pipeline.active).toBe(state.pipeline.default);
        expect(state.node).toEqual(mockState.animals.node);
      });

      it("shouldn't make a second data request if the pipeline flag is false", async () => {
        const { pipeline } = mockState.animals;
        const active = pipeline.ids.find(id => id !== pipeline.default);
        saveState({ pipeline: { active } });
        const state = reducer(mockState.json, changeFlag('pipelines', false));
        const store = createStore(reducer, state);
        await loadInitialPipelineData()(store.dispatch, store.getState);
        expect(store.getState().node).toEqual(mockState.animals.node);
      });

      it("shouldn't make a second data request if the dataset doesn't support pipelines", async () => {
        window.deletePipelines = true; // pass option to load-data mock
        const { pipeline } = mockState.animals;
        const active = pipeline.ids.find(id => id !== pipeline.default);
        saveState({ pipeline: { active } });
        const store = createStore(reducer, mockState.json);
        await loadInitialPipelineData()(store.dispatch, store.getState);
        expect(store.getState().node).toEqual(mockState.animals.node);
      });
    });
  });
});
