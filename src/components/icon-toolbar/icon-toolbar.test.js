import React from 'react';
import ConnectedIconToolbar, {
  IconToolbar,
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('IconToolbar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ConnectedIconToolbar />);
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(9);
  });

  it('hides all buttons (except menu button) when visible prop is false for each of them', () => {
    const visible = {
      themeBtn: false,
      labelBtn: false,
      layerBtn: false,
      exportBtn: false
    };
    const wrapper = setup.mount(<ConnectedIconToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(5);
  });

  it('hides one button when visible prop is false for one of them', () => {
    const visible = {
      labelBtn: false
    };
    const wrapper = setup.mount(<ConnectedIconToolbar />, { visible });
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(8);
  });

  const functionCalls = [
    ['menu', 'onToggleSidebar'],
    ['theme', 'onToggleTheme'],
    ['label', 'onToggleTextLabels'],
    ['export', 'onToggleExportModal'],
    ['layers', 'onToggleLayers']
  ];

  test.each(functionCalls)(
    'calls %s function on %s button click',
    (icon, callback) => {
      const mockFn = jest.fn();
      const props = {
        textLabels: mockState.animals.textLabels,
        theme: mockState.animals.theme,
        visible: mockState.animals.visible,
        [callback]: mockFn
      };
      const wrapper = setup.mount(<IconToolbar {...props} />);
      expect(mockFn.mock.calls.length).toBe(0);
      wrapper
        .find({ icon })
        .find('button')
        .simulate('click');
      expect(mockFn.mock.calls.length).toBe(1);
    }
  );

  it('maps state to props', () => {
    const expectedResult = {
      disableLayerBtn: expect.any(Boolean),
      textLabels: expect.any(Boolean),
      theme: expect.stringMatching(/light|dark/),
      visible: expect.objectContaining({
        exportBtn: expect.any(Boolean),
        exportModal: expect.any(Boolean),
        labelBtn: expect.any(Boolean),
        layerBtn: expect.any(Boolean),
        layers: expect.any(Boolean),
        themeBtn: expect.any(Boolean),
        sidebar: expect.any(Boolean)
      })
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  describe('mapDispatchToProps', () => {
    it('onToggleExportModal', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleExportModal(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_EXPORT_MODAL'
      });
    });

    it('onToggleLayers', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleLayers(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_LAYERS'
      });
    });

    it('onToggleSidebar', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleSidebar(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        visible: true,
        type: 'TOGGLE_SIDEBAR'
      });
    });

    it('onToggleTextLabels', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleTextLabels(true);
      expect(dispatch.mock.calls[0][0]).toEqual({
        textLabels: true,
        type: 'TOGGLE_TEXT_LABELS'
      });
    });

    it('onToggleTheme', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleTheme('light');
      expect(dispatch.mock.calls[0][0]).toEqual({
        theme: 'light',
        type: 'TOGGLE_THEME'
      });
    });
  });
});
