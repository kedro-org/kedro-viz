import React from 'react';
import { mount } from 'enzyme';
import History, {
  History as UnconnectedHistory,
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { mockState, setup } from '../../utils/state.mock';
import { getSnapshotHistory } from '../../selectors';

const props = {
  activeSnapshot: 0,
  allowHistoryDeletion: true,
  onChangeActiveSnapshot: jest.fn(),
  onDeleteSnapshot: jest.fn(),
  snapshots: getSnapshotHistory(mockState),
  theme: 'light'
};

describe('History', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<History />);
    expect(wrapper.find('ul').hasClass('pipeline-history')).toBe(true);
  });

  it('calls a function to change the active snapshot', () => {
    const wrapper = mount(<UnconnectedHistory {...props} />);
    expect(wrapper.props().onChangeActiveSnapshot.mock.calls.length).toBe(0);
    wrapper
      .find('li:not(.pipeline-history__row--active)')
      .first()
      .find('input')
      .simulate('change');
    expect(wrapper.props().onChangeActiveSnapshot.mock.calls.length).toBe(1);
  });

  it('changes the active snapshot', () => {
    const wrapper = setup.mount(<History />);
    const activeSnapshot1 = wrapper.find('History').props().activeSnapshot;
    wrapper
      .find('li:not(.pipeline-history__row--active)')
      .first()
      .find('input')
      .simulate('change');
    const activeSnapshot2 = wrapper.find('History').props().activeSnapshot;
    expect(activeSnapshot1).not.toBe(activeSnapshot2);
  });

  it('calls a function to delete a snapshot', () => {
    const wrapper = mount(<UnconnectedHistory {...props} />);
    expect(wrapper.props().onDeleteSnapshot.mock.calls.length).toBe(0);
    wrapper
      .find('.pipeline-history__delete')
      .first()
      .simulate('click');
    expect(wrapper.props().onDeleteSnapshot.mock.calls.length).toBe(1);
  });

  it('deletes a snapshot', () => {
    const wrapper = setup.mount(<History />);
    const snapshotsLength1 = wrapper.find('History').props().snapshots.length;
    wrapper
      .find('.pipeline-history__delete')
      .first()
      .simulate('click');
    const snapshotsLength2 = wrapper.find('History').props().snapshots.length;
    expect(snapshotsLength2).toBe(snapshotsLength1 - 1);
  });

  it('maps state to props', () => {
    const expectedResult = {
      activeSnapshot: mockState.activeSnapshot,
      allowHistoryDeletion: mockState.allowHistoryDeletion,
      snapshots: getSnapshotHistory(mockState),
      theme: mockState.theme
    };
    expect(mapStateToProps(mockState)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch).onChangeActiveSnapshot({ id: '123' });
    expect(dispatch.mock.calls[0][0]).toEqual({
      snapshotID: '123',
      type: 'CHANGE_ACTIVE_SNAPSHOT'
    });
    mapDispatchToProps(dispatch).onDeleteSnapshot({ id: '321' });
    expect(dispatch.mock.calls[1][0]).toEqual({
      id: '321',
      type: 'DELETE_SNAPSHOT'
    });
  });
});
