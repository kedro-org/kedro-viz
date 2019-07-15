import React from 'react';
import TagList, {
  TagList as UnconnectedTagList,
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('TagList', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<TagList />);
    const container = wrapper.find('.pipeline-tags');
    expect(container.length).toBe(1);
  });

  it('shows a label with the number of active/total filters', () => {
    const wrapper = setup.mount(<TagList />);
    const { tagCount } = wrapper.find('TagList').props();
    const label = wrapper
      .find('.kui-dropdown__label')
      .find('span')
      .at(0)
      .text();
    expect(label).toEqual(
      expect.stringContaining(`(${tagCount.enabled}/${tagCount.total})`)
    );
  });

  it('shows a placeholder message if there are no tags used in the active snapshot', () => {
    const wrapper = setup.shallow(UnconnectedTagList, {
      tagCount: { total: 0 }
    });
    const container = wrapper.find('.pipeline-tags__empty');
    expect(container.length).toBe(1);
  });

  describe('tag list item', () => {
    const wrapper = setup.mount(<TagList />);

    it('should be inactive by default', () => {
      expect(
        wrapper
          .find('TagList')
          .props()
          .tags.every(d => d.active === false)
      ).toBe(true);
    });

    it('sets a tag as active on mouseover', () => {
      wrapper
        .find('.pipeline-tags__tag-list-item')
        .first()
        .simulate('mouseenter');
      expect(wrapper.find('TagList').props().tags[0].active).toBe(true);
    });

    it('sets a tag as no longer active on mouseleave', () => {
      wrapper
        .find('.pipeline-tags__tag-list-item')
        .first()
        .simulate('mouseleave');
      expect(wrapper.find('TagList').props().tags[0].active).toBe(false);
    });
  });

  describe('checkbox', () => {
    const wrapper = setup.mount(<TagList />);

    it('should be disabled by default', () => {
      expect(
        wrapper
          .find('TagList')
          .props()
          .tags.every(d => d.enabled === false)
      ).toBe(true);
    });

    it('sets a tag as enabled on toggling the checkbox', () => {
      expect(wrapper.find('TagList').props().tags[0].enabled).toBe(false);
      wrapper
        .find('.kui-switch__input')
        .first()
        .simulate('change', { target: { checked: true } });
      expect(wrapper.find('TagList').props().tags[0].enabled).toBe(true);
    });

    it('sets a tag as disabled on toggling the checkbox again', () => {
      wrapper
        .find('.kui-switch__input')
        .first()
        .simulate('change', { target: { checked: false } });
      expect(wrapper.find('TagList').props().tags[0].enabled).toBe(false);
    });
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState)).toEqual({
      tagCount: {
        total: expect.any(Number),
        enabled: expect.any(Number)
      },
      tags: expect.any(Array),
      theme: mockState.theme
    });
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onToggleTagActive('123', true);
    expect(dispatch.mock.calls[0][0]).toEqual({
      tagID: '123',
      active: true,
      type: 'TOGGLE_TAG_ACTIVE'
    });

    mapDispatchToProps(dispatch).onToggleTagFilter('456', true);
    expect(dispatch.mock.calls[1][0]).toEqual({
      tagID: '456',
      enabled: true,
      type: 'TOGGLE_TAG_FILTER'
    });
  });
});
