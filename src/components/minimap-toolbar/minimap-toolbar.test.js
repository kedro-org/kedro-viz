import React from 'react';
import ConnectedMiniMapToolbar, {
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('MiniMapToolbar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ConnectedMiniMapToolbar />);
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(4);
  });

  it('maps state to props', () => {
    const expectedResult = {
      chartZoom: expect.any(Object),
      visible: expect.objectContaining({
        miniMap: expect.any(Boolean),
        miniMapBtn: expect.any(Boolean)
      })
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  it('mapDispatchToProps', () => {
    const dispatch = jest.fn();
    const expectedResult = {
      onToggleMiniMap: expect.any(Function),
      onUpdateChartZoom: expect.any(Function)
    };
    expect(mapDispatchToProps(dispatch)).toEqual(expectedResult);
  });
});
