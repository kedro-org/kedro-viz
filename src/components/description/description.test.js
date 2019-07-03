import { Description, mapStateToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';
import {
  getActiveSnapshotMessage,
  getActiveSnapshotTimestamp
} from '../../selectors';

const props = {
  message: getActiveSnapshotMessage(mockState),
  showDescription: true,
  timestamp: getActiveSnapshotTimestamp(mockState),
  visibleNav: true
};

describe('Description', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(Description, props);
    expect(wrapper.find('.snapshot-description').length).toBe(1);
  });

  it('adds a menu-visible class when menu is visible', () => {
    const wrapper = setup.shallow(Description, props);
    expect(
      wrapper
        .find('.snapshot-description')
        .hasClass('snapshot-description--menu-visible')
    ).toBe(true);
  });

  it('removes menu-visible class when menu is hidden', () => {
    const wrapper = setup.shallow(
      Description,
      Object.assign({}, props, { visibleNav: false })
    );
    expect(
      wrapper
        .find('.snapshot-description')
        .hasClass('snapshot-description--menu-visible')
    ).toBe(false);
  });

  it('returns null when showDescription is false', () => {
    const wrapper = setup.shallow(Description, { showDescription: false });
    expect(wrapper.html()).toBe(null);
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
