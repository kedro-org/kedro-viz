import { mockState } from '../utils/state.mock';
import { getTagData, getTagCount } from './tags';
import { toggleTagFilter } from '../actions';
import reducer from '../reducers';

const getTagIDs = state => state.tag.ids;
const tagIDs = getTagIDs(mockState.lorem);
const tagData = getTagData(mockState.lorem);

describe('Selectors', () => {
  describe('getTagData', () => {
    it('retrieves the formatted list of tag filters', () => {
      expect(tagData).toEqual(
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
      expect(tagData.map(d => d.id)).toEqual(tagIDs.sort());
    });
  });

  describe('getTagCount', () => {
    const newMockState = reducer(
      mockState.lorem,
      toggleTagFilter(tagIDs[0], true)
    );

    it('retrieves the total and enabled number of tags', () => {
      expect(getTagCount(mockState.lorem)).toEqual(
        expect.objectContaining({
          enabled: 0,
          total: tagIDs.length
        })
      );
    });

    it('retrieves the total and enabled number of tags when enabled count is updated', () => {
      expect(getTagCount(newMockState)).toEqual(
        expect.objectContaining({
          enabled: 1,
          total: tagIDs.length
        })
      );
    });
  });
});
