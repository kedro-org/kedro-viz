import React from 'react';
import { mount } from 'enzyme';
import { History, mapStateToProps, mapDispatchToProps } from './index';
import { fakeState } from '../../utils/test-data';
import { getSnapshotHistory } from '../../selectors';

function setup() {
  const props = {
    activeSnapshot: 0,
    allowHistoryDeletion: true,
    onChangeActiveSnapshot: jest.fn(),
    onDeleteSnapshot: jest.fn(),
    snapshots: getSnapshotHistory(fakeState),
    theme: 'light'
  };

  const wrapper = mount(<History {...props} />);

  return {
    props,
    wrapper
  };
}

describe('History', () => {
  it('renders without crashing', () => {
    const { wrapper } = setup();
    expect(wrapper.find('ul').hasClass('pipeline-history')).toBe(true);
  });

  it('changes the active snapshot', () => {
    const { wrapper, props } = setup();
    expect(props.onChangeActiveSnapshot.mock.calls.length).toBe(0);
    wrapper
      .find('li:not(.pipeline-history__row--active) input')
      .simulate('change');
    expect(props.onChangeActiveSnapshot.mock.calls.length).toBe(1);
  });

  it('deletes a snapshot', () => {
    const { wrapper, props } = setup();
    expect(props.onDeleteSnapshot.mock.calls.length).toBe(0);
    wrapper.find('.pipeline-history__delete').simulate('click');
    expect(props.onDeleteSnapshot.mock.calls.length).toBe(1);
  });

  it('maps state to props', () => {
    const expectedResult = {
      activeSnapshot: fakeState.activeSnapshot,
      allowHistoryDeletion: fakeState.allowHistoryDeletion,
      snapshots: getSnapshotHistory(fakeState),
      theme: fakeState.theme
    };
    expect(mapStateToProps(fakeState)).toEqual(expectedResult);
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
