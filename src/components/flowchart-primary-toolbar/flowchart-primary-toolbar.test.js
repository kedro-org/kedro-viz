import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import ConnectedFlowchartPrimaryToolbar, {
  FlowchartPrimaryToolbar,
  mapStateToProps,
  mapDispatchToProps,
} from './flowchart-primary-toolbar';
import { setup, mockState } from '../../utils/state.mock';

jest.mock('../../utils/hooks/use-generate-pathname', () => ({
  useGeneratePathname: () => ({
    toSetQueryParam: jest.fn(),
  }),
}));

describe('PrimaryToolbar', () => {
  it('renders without crashing', () => {
    setup.render(<ConnectedFlowchartPrimaryToolbar />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('hides all buttons (except menu) when display prop is false for each of them', () => {
    const props = {
      displaySidebar: true,
      textLabels: true,
      visible: mockState.spaceflights.visible,
      display: {
        labelBtn: false,
        layerBtn: false,
        exportBtn: false,
        expandPipelinesBtn: false,
        orientationBtn: false,
      },
      modularPipelineIDs: ['pipeline1', '__root__'],
      onToggleSidebar: jest.fn(),
      onToggleTextLabels: jest.fn(),
      onToggleExportModal: jest.fn(),
      onToggleLayers: jest.fn(),
      onToggleExpandAllPipelines: jest.fn(),
      orientation: 'horizontal',
      expandedPipelines: false,
      disableLayerBtn: false,
      visibleLayers: true,
    };

    const { container } = setup.render(<FlowchartPrimaryToolbar {...props} />, {
      withRouter: true,
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1); // Only menu button
  });

  it('hides one button when display.labelBtn is false', () => {
    const props = {
      displaySidebar: true,
      textLabels: true,
      visible: mockState.spaceflights.visible,
      display: {
        ...mockState.spaceflights.display,
        labelBtn: false,
      },
      modularPipelineIDs: ['pipeline1', '__root__'],
      onToggleSidebar: jest.fn(),
      onToggleTextLabels: jest.fn(),
      onToggleExportModal: jest.fn(),
      onToggleLayers: jest.fn(),
      onToggleExpandAllPipelines: jest.fn(),
      orientation: 'horizontal',
      expandedPipelines: false,
      disableLayerBtn: false,
      visibleLayers: true,
    };

    const { container } = setup.render(<FlowchartPrimaryToolbar {...props} />);
    const buttons = container.querySelectorAll(
      '.pipeline-icon-toolbar__button'
    );
    expect(buttons.length).toBe(5); // 6 total - 1 hidden
  });

  const functionCalls = [
    ['.pipeline-menu-button--menu', 'onToggleSidebar'],
    ['.pipeline-menu-button--labels', 'onToggleTextLabels'],
    ['.pipeline-menu-button--export', 'onToggleExportModal'],
    ['.pipeline-menu-button--layers', 'onToggleLayers'],
    ['.pipeline-menu-button--pipeline', 'onToggleExpandAllPipelines'],
  ];

  test.each(functionCalls)(
    'calls %s function on %s button click',
    (selector, callback) => {
      const mockFn = jest.fn();
      const props = {
        displaySidebar: true,
        textLabels: mockState.spaceflights.textLabels,
        visible: mockState.spaceflights.visible,
        display: mockState.spaceflights.display,
        modularPipelineIDs: ['pipeline1', '__root__'],
        [callback]: mockFn,
        onToggleExpandPipelines: jest.fn(),
        orientation: 'horizontal',
        expandedPipelines: false,
        disableLayerBtn: false,
        visibleLayers: true,
      };

      const { container } = setup.render(
        <FlowchartPrimaryToolbar {...props} />,
        {
          withRouter: false,
        }
      );
      const button = container.querySelector(selector);
      expect(button).not.toBeNull();
      fireEvent.click(button);
      expect(mockFn).toHaveBeenCalledTimes(1);
    }
  );

  it('maps state to props', () => {
    const expectedResult = {
      disableLayerBtn: expect.any(Boolean),
      textLabels: expect.any(Boolean),
      expandedPipelines: expect.any(Boolean),
      orientation: expect.any(String),
      visible: expect.objectContaining({
        exportModal: expect.any(Boolean),
        metadataModal: expect.any(Boolean),
        settingsModal: expect.any(Boolean),
        sidebar: expect.any(Boolean),
      }),
      display: expect.objectContaining({
        exportBtn: expect.any(Boolean),
        labelBtn: expect.any(Boolean),
        layerBtn: expect.any(Boolean),
        orientationBtn: expect.any(Boolean),
        expandPipelinesBtn: expect.any(Boolean),
      }),
      visibleLayers: expect.any(Boolean),
    };
    expect(mapStateToProps(mockState.spaceflights)).toEqual(expectedResult);
  });

  describe('mapDispatchToProps', () => {
    it('onToggleExportModal', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleExportModal(true);
      expect(dispatch).toHaveBeenCalledWith({
        visible: true,
        type: 'TOGGLE_EXPORT_MODAL',
      });
    });

    it('onToggleLayers', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleLayers(true);
      expect(dispatch).toHaveBeenCalledWith({
        visible: true,
        type: 'TOGGLE_LAYERS',
      });
    });

    it('onToggleSidebar', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleSidebar(true);
      expect(dispatch).toHaveBeenCalledWith({
        visible: true,
        type: 'TOGGLE_SIDEBAR',
      });
    });

    it('onToggleTextLabels', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleTextLabels(true);
      expect(dispatch).toHaveBeenCalledWith({
        textLabels: true,
        type: 'TOGGLE_TEXT_LABELS',
      });
    });

    it('onToggleExpandAllPipelines', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onToggleExpandAllPipelines(true);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'TOGGLE_EXPAND_ALL_PIPELINES',
        shouldExpandAllPipelines: true,
      });
    });
  });
});
