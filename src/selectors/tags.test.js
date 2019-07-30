import { mockState } from '../utils/state.mock';
import { getActiveSnapshotTags, getTags, getTagCount } from './tags';
import { toggleTagFilter } from '../actions';
import reducer from '../reducers';

const activeSnapshotTags = getActiveSnapshotTags(mockState);
const tags = getTags(mockState);

describe('Selectors', () => {
  describe('getActiveSnapshotTags', () => {
    it('retrieves a list of tags for the active snapshot', () => {
      expect(activeSnapshotTags).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('returns an empty array if snapshotTags is empty', () => {
      const newMockState = Object.assign({}, mockState, { snapshotTags: {} });
      expect(getActiveSnapshotTags(newMockState)).toEqual([]);
    });

    it('returns an empty array if activeSnapshot is undefined', () => {
      const newMockState = Object.assign({}, mockState, {
        activeSnapshot: undefined
      });
      expect(getActiveSnapshotTags(newMockState)).toEqual([]);
    });
  });

  describe('getTags', () => {
    it('retrieves the formatted list of tag filters', () => {
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            active: false,
            enabled: false
          })
        ])
      );
    });

    it('retrieves a list of tags sorted by ID name', () => {
      expect(tags.map(d => d.id)).toEqual(activeSnapshotTags.sort());
    });
  });

  describe('getTagCount', () => {
    const newMockState = reducer(
      mockState,
      toggleTagFilter(activeSnapshotTags[0], true)
    );

    it('retrieves the total and enabled number of tags', () => {
      expect(getTagCount(mockState)).toEqual(
        expect.objectContaining({
          enabled: 0,
          total: activeSnapshotTags.length
        })
      );
    });

    it('retrieves the total and enabled number of tags when enabled count is updated', () => {
      expect(getTagCount(newMockState)).toEqual(
        expect.objectContaining({
          enabled: 1,
          total: activeSnapshotTags.length
        })
      );
    });
  });
});
