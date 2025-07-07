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

// Default props factory to reduce duplication
const createDefaultProps = (overrides = {}) => ({
  displaySidebar: true,
  textLabels: true,
  visible: mockState.spaceflights.visible,
  display: mockState.spaceflights.display,
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
  isFlowchartView: true,
  ...overrides,
});

describe('PrimaryToolbar', () => {
  it('renders without crashing', () => {
    setup.render(<ConnectedFlowchartPrimaryToolbar />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('hides all buttons (except menu) when display prop is false for each of them', () => {
    const props = createDefaultProps({
      display: {
        labelBtn: false,
        layerBtn: false,
        exportBtn: false,
        expandPipelinesBtn: false,
        orientationBtn: false,
      },
    });

    const { container } = setup.render(<FlowchartPrimaryToolbar {...props} />, {
      withRouter: true,
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1); // Only menu button
  });

  it('hides one button when display.labelBtn is false', () => {
    const props = createDefaultProps({
      display: {
        ...mockState.spaceflights.display,
        labelBtn: false,
      },
    });

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
      const props = createDefaultProps({
        [callback]: mockFn,
        onToggleExpandPipelines: jest.fn(),
      });

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

  // Test cases for button visibility based on isFlowchartView
  const buttonVisibilityTests = [
    {
      name: 'text labels button',
      selector: '.pipeline-menu-button--labels',
      displayProp: 'labelBtn',
    },
    {
      name: 'expand pipelines button',
      selector: '.pipeline-menu-button--pipeline',
      displayProp: 'expandPipelinesBtn',
    },
  ];

  test.each(buttonVisibilityTests)(
    'hides $name when isFlowchartView is false',
    ({ selector, displayProp }) => {
      const props = createDefaultProps({
        display: {
          ...mockState.spaceflights.display,
          [displayProp]: true,
        },
        isFlowchartView: false,
      });

      const { container } = setup.render(
        <FlowchartPrimaryToolbar {...props} />
      );
      const button = container.querySelector(selector);
      expect(button).toBeNull();
    }
  );

  it('maps state to props', () => {
    const expectedResult = {
      disableLayerBtn: expect.any(Boolean),
      textLabels: expect.any(Boolean),
      expandedPipelines: expect.any(Boolean),
      orientation: expect.any(String),
      isFlowchartView: expect.any(Boolean),
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
    const dispatchTests = [
      {
        method: 'onToggleExportModal',
        arg: true,
        expectedAction: {
          visible: true,
          type: 'TOGGLE_EXPORT_MODAL',
        },
      },
      {
        method: 'onToggleLayers',
        arg: true,
        expectedAction: {
          visible: true,
          type: 'TOGGLE_LAYERS',
        },
      },
      {
        method: 'onToggleSidebar',
        arg: true,
        expectedAction: {
          visible: true,
          type: 'TOGGLE_SIDEBAR',
        },
      },
      {
        method: 'onToggleTextLabels',
        arg: true,
        expectedAction: {
          textLabels: true,
          type: 'TOGGLE_TEXT_LABELS',
        },
      },
      {
        method: 'onToggleExpandAllPipelines',
        arg: true,
        expectedAction: {
          type: 'TOGGLE_EXPAND_ALL_PIPELINES',
          shouldExpandAllPipelines: true,
        },
      },
    ];

    test.each(dispatchTests)(
      '$method dispatches correct action',
      ({ method, arg, expectedAction }) => {
        const dispatch = jest.fn();
        mapDispatchToProps(dispatch)[method](arg);
        expect(dispatch).toHaveBeenCalledWith(expectedAction);
      }
    );
  });
});
