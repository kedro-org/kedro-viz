import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ConnectedGlobalToolbar, {
  GlobalToolbar,
  mapStateToProps,
  mapDispatchToProps,
} from './global-toolbar';
import { mockState, setup } from '../../utils/state.mock';

describe('GlobalToolbar', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(
      <MemoryRouter>
        <ConnectedGlobalToolbar />
      </MemoryRouter>
    );
    const buttons = container.querySelectorAll(
      '.pipeline-icon-toolbar__button'
    );
    expect(buttons.length).toBe(6);
  });

  const functionCalls = [
    ['.pipeline-menu-button--theme', 'onToggleTheme'],
    ['.pipeline-menu-button--settings', 'onToggleSettingsModal'],
  ];

  test.each(functionCalls)(
    'calls %s function on %s button click',
    (selector, callback) => {
      const mockFn = jest.fn();
      const props = {
        theme: mockState.spaceflights.theme,
        visible: mockState.spaceflights.visible,
        runStatusPipelineInfo: {},
        view: 'flowchart',
        [callback]: mockFn,
      };

      const { container } = setup.render(
        <MemoryRouter>
          <GlobalToolbar {...props} />
        </MemoryRouter>
      );

      const button = container.querySelector(selector);
      expect(button).not.toBeNull();
      button.click();
      expect(mockFn).toHaveBeenCalledTimes(1);
    }
  );

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.stringMatching(/light|dark/),
      visible: {
        code: false,
        exportModal: false,
        graph: true,
        miniMap: true,
        modularPipelineFocusMode: null,
        metadataModal: false,
        settingsModal: false,
        shareableUrlModal: false,
        sidebar: true,
        slicing: true,
        traceback: false,
      },
      view: 'flowchart',
      runStatusPipelineInfo: {},
    };
    expect(mapStateToProps(mockState.spaceflights)).toEqual(expectedResult);
  });

  describe('mapDispatchToProps', () => {
    it('onToggleTheme', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleTheme('light');
      expect(dispatch).toHaveBeenCalledWith({
        theme: 'light',
        type: 'TOGGLE_THEME',
      });
    });

    it('onToggleSettingsModal', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleSettingsModal(true);
      expect(dispatch).toHaveBeenCalledWith({
        visible: true,
        type: 'TOGGLE_SETTINGS_MODAL',
      });
    });
  });
});
