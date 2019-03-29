import React from 'react';
import { mount } from 'enzyme';
import { Description, mapStateToProps } from './index';
import { mockState } from '../../utils/data.mock';
import {
  getActiveSnapshotMessage,
  getActiveSnapshotTimestamp
} from '../../selectors';

function setup() {
  const props = {
    message: getActiveSnapshotMessage(mockState),
    showDescription: true,
    timestamp: getActiveSnapshotTimestamp(mockState),
    visibleNav: true
  };

  const wrapper = mount(<Description {...props} />);

  return {
    props,
    wrapper
  };
}

describe('Description', () => {
  it('renders without crashing', () => {
    const { wrapper } = setup();
    expect(
      wrapper
        .find('.snapshot-description')
        .hasClass('snapshot-description--menu-visible')
    ).toBe(true);
  });

  it('maps state to props', () => {
    const message = getActiveSnapshotMessage(mockState);
    const expectedResult = {
      message,
      showDescription: message && mockState.showHistory,
      timestamp: getActiveSnapshotTimestamp(mockState)
    };
    expect(mapStateToProps(mockState)).toEqual(expectedResult);
  });
});
