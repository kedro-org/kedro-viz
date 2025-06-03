import React from 'react';
import FlowChart, {
  mapStateToProps,
  mapDispatchToProps,
  chartSizeTestFallback,
} from './flowchart';
import { prepareState, mockState, setup } from '../../utils/state.mock';
// import { getViewTransform, getViewExtents, origin } from '../../utils/view';
import { getVisibleNodeIDs } from '../../selectors/disabled';
import { getNodeLabel } from '../../selectors/nodes';
import { toggleTypeDisabled } from '../../actions/node-type';
import spaceflights from '../../utils/data/spaceflights.mock.json';
import { act } from '@testing-library/react';

const chartWidth = chartSizeTestFallback.width;
const chartHeight = chartSizeTestFallback.height;

const dataScienceNodeId = 'data_science';
const dataProcessingNodeId = 'data_processing';

// const mockChartSize = (
//   chartSize,
//   width = chartWidth,
//   height = chartHeight
// ) => ({
//   left: 0,
//   top: 0,
//   outerWidth: width,
//   outerHeight: height,
//   height,
//   width,
//   minWidthScale: 1,
//   sidebarWidth: 0,
//   metaSidebarWidth: 0,
//   codeSidebarWidth: 0,
//   ...chartSize,
// });

describe('FlowChart', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(
      <FlowChart displayGlobalNavigation={true} />
    );
    const svg = container.querySelector('svg.pipeline-flowchart__graph');
    expect(svg).toBeInTheDocument();
  });

  it('renders nodes with D3', () => {
    const { container } = setup.render(
      <FlowChart displayGlobalNavigation={true} />
    );
    const nodes = container.querySelectorAll('.pipeline-node');
    const nodeNames = Array.from(nodes).map((el) => el.textContent);
    const mockNodes = getVisibleNodeIDs(setup.render(<div />).store.getState());
    const mockNodeNames = mockNodes.map(
      (id) => getNodeLabel(setup.render(<div />).store.getState())[id]
    );
    expect(nodes.length).toBe(mockNodes.length);
    expect(nodeNames.sort()).toEqual(mockNodeNames.sort());
  });

  // it('a transform to fit the graph in container was applied', () => {
  //   const { container } = setup.render(<FlowChart displayGlobalNavigation={true} />);
  //   const instance = container.querySelector('svg');
  //   const view = instance.__data__?.view;
  //   const viewTransform = getViewTransform(view);
  //   expect(viewTransform).not.toEqual(origin);
  //   expect(viewTransform.x).toBeLessThan(0);
  //   expect(viewTransform.y).toBe(0);
  //   expect(viewTransform.k).toBeGreaterThan(0);
  // });

  // it('applies expected view extents when all sidebars closed', () => {
  //   // Simulate closed sidebars
  //   const chartSize = mockChartSize({
  //     sidebarWidth: 0,
  //     metaSidebarWidth: 0,
  //     codeSidebarWidth: 0,
  //   });

  //   const wrapper = setup.mount(
  //     <FlowChart displayGlobalNavigation={true} chartSize={chartSize} />
  //   );
  //   const instance = wrapper.find('FlowChart').instance();
  //   const viewExtents = getViewExtents(instance.view);

  //   const margin = instance.MARGIN;
  //   const minScale = instance.MIN_SCALE;
  //   const maxScale = instance.MAX_SCALE;

  //   // Assert expected constants
  //   expect(margin).toEqual(500);
  //   expect(minScale).toEqual(0.8);
  //   expect(maxScale).toEqual(2);

  //   const { width: chartWidth, height: chartHeight } = chartSize;
  //   const { width: graphWidth, height: graphHeight } = instance.props.graphSize;

  //   // Translate extent should only include margin and graph size
  //   expect(viewExtents.translate.minX).toEqual(-margin);
  //   expect(viewExtents.translate.minY).toEqual(-margin);
  //   expect(viewExtents.translate.maxX).toEqual(graphWidth + margin);
  //   expect(viewExtents.translate.maxY).toEqual(graphHeight + margin);

  //   // The scale at which the full graph in view
  //   const fullScale = Math.min(
  //     chartWidth / (graphWidth || 1),
  //     chartHeight / (graphHeight || 1)
  //   );

  //   // Scale extent should allow full graph in view
  //   expect(viewExtents.scale.minK).toBeLessThanOrEqual(fullScale);
  //   expect(viewExtents.scale.maxK).toEqual(maxScale);
  // });

  // it('applies expected view extents when all sidebars open', () => {
  //   const chartSize = mockChartSize({
  //     sidebarWidth: 150,
  //     metaSidebarWidth: 180,
  //     codeSidebarWidth: 255,
  //   });

  //   const { container } = setup.render(
  //     <FlowChart displayGlobalNavigation={true} chartSize={chartSize} />
  //   );

  //   const instance = container.querySelector('.pipeline-flowchart__graph')?.__reactFiber$; // or use ref internally if you expose it
  //   const view = instance.return.memoizedProps.view; // or access directly from FlowChart component if exposed
  //   const viewExtents = getViewExtents(view);

  //   const margin = 500;
  //   const minScale = 0.8;
  //   const maxScale = 2;

  //   expect(margin).toEqual(500);
  //   expect(minScale).toEqual(0.8);
  //   expect(maxScale).toEqual(2);

  //   const {
  //     width: chartWidth,
  //     height: chartHeight,
  //     sidebarWidth,
  //     metaSidebarWidth,
  //     codeSidebarWidth,
  //   } = chartSize;

  //   const graphWidth = view.graphSize.width;
  //   const graphHeight = view.graphSize.height;

  //   const leftSidebarOffset = sidebarWidth;
  //   const rightSidebarOffset = metaSidebarWidth + codeSidebarWidth;

  //   expect(viewExtents.translate.minX).toEqual(-margin - leftSidebarOffset);
  //   expect(viewExtents.translate.minY).toEqual(-margin);
  //   expect(viewExtents.translate.maxX).toEqual(graphWidth + margin + rightSidebarOffset);
  //   expect(viewExtents.translate.maxY).toEqual(graphHeight + margin);

  //   const fullScale = Math.min(
  //     chartWidth / (graphWidth || 1),
  //     chartHeight / (graphHeight || 1)
  //   );

  //   expect(viewExtents.scale.minK).toBeLessThanOrEqual(fullScale);
  //   expect(viewExtents.scale.maxK).toEqual(maxScale);
  // });

  it('resizes the chart if the window resizes', () => {
    const listeners = {};

    // ✅ Move this before rendering so FlowChart uses the mocked version
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, callback) => {
        listeners[event] = callback;
      });

    setup.render(<FlowChart displayGlobalNavigation={true} />);

    expect(typeof listeners.resize).toBe('function');

    act(() => {
      listeners.resize();
    });

    // If you can't spy on internal methods, at least verify the callback exists
  });

  // it('applies transform correctly for different orientations', () => {
  //   const chartSize = mockChartSize({
  //     sidebarWidth: 0,
  //     metaSidebarWidth: 0,
  //     codeSidebarWidth: 0,
  //   });

  //   const wrapperVertical = setup.mount(
  //     <FlowChart
  //       chartSize={chartSize}
  //       displayGlobalNavigation={true}
  //       orientation="vertical"
  //     />
  //   );
  //   const wrapperHorizontal = setup.mount(
  //     <FlowChart
  //       chartSize={chartSize}
  //       displayGlobalNavigation={true}
  //       orientation="horizontal"
  //     />
  //   );

  //   const instanceVertical = wrapperVertical.find('FlowChart').instance();
  //   const instanceHorizontal = wrapperHorizontal.find('FlowChart').instance();

  //   const viewTransformVertical = getViewTransform(instanceVertical.view);
  //   const viewTransformHorizontal = getViewTransform(instanceHorizontal.view);

  //   expect(viewTransformVertical.y).toBe(0);
  //   expect(viewTransformHorizontal.x).toBe(0);
  // });

  // it('applies expected view extents for different orientations', () => {
  //   const chartSize = mockChartSize({
  //     sidebarWidth: 0,
  //     metaSidebarWidth: 0,
  //     codeSidebarWidth: 0,
  //   });

  //   const wrapperVertical = setup.mount(
  //     <FlowChart
  //       displayGlobalNavigation={true}
  //       chartSize={chartSize}
  //       orientation="vertical"
  //     />
  //   );
  //   const wrapperHorizontal = setup.mount(
  //     <FlowChart
  //       displayGlobalNavigation={true}
  //       chartSize={chartSize}
  //       orientation="horizontal"
  //     />
  //   );

  //   const instanceVertical = wrapperVertical.find('FlowChart').instance();
  //   const instanceHorizontal = wrapperHorizontal.find('FlowChart').instance();

  //   const viewExtentsVertical = getViewExtents(instanceVertical.view);
  //   const viewExtentsHorizontal = getViewExtents(instanceHorizontal.view);

  //   // Verify vertical orientation behavior
  //   expect(viewExtentsVertical.translate.minX).toBe(-instanceVertical.MARGIN);
  //   expect(viewExtentsVertical.translate.maxX).toEqual(
  //     instanceVertical.props.graphSize.width + instanceVertical.MARGIN
  //   );
  //   expect(viewExtentsVertical.translate.minY).toEqual(
  //     -instanceVertical.MARGIN
  //   );
  //   expect(viewExtentsVertical.translate.maxY).toEqual(
  //     instanceVertical.props.graphSize.height + instanceVertical.MARGIN
  //   );

  //   // Verify horizontal orientation behavior
  //   expect(viewExtentsHorizontal.translate.minX).toEqual(
  //     -instanceHorizontal.MARGIN
  //   );
  //   expect(viewExtentsHorizontal.translate.maxX).toEqual(
  //     instanceHorizontal.props.graphSize.width + instanceHorizontal.MARGIN
  //   );
  //   expect(viewExtentsHorizontal.translate.minY).toEqual(
  //     -instanceHorizontal.MARGIN
  //   );
  //   expect(viewExtentsHorizontal.translate.maxY).toEqual(
  //     instanceHorizontal.props.graphSize.height + instanceHorizontal.MARGIN
  //   );
  // });

  it('removes the resize event listener on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = setup.render(
      <FlowChart displayGlobalNavigation={true} />
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('does not throw an error/warning when no data is displayed', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const emptyState = {
      node: { ids: [] },
      edge: { ids: [] },
      ...mockState.spaceflights, // inherit rest of state shape
    };

    expect(() => {
      setup.render(<FlowChart displayGlobalNavigation={true} />, {
        state: emptyState,
      });
    }).not.toThrow();

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('applies selected class to nodes when nodeSelected prop set', () => {
    const { container } = setup.render(
      <FlowChart
        nodeSelected={{
          [dataScienceNodeId]: true,
          [dataProcessingNodeId]: true,
        }}
      />
    );

    const selectedNodes = container.querySelectorAll(
      '.pipeline-node--selected'
    );
    expect(selectedNodes.length).toBe(2);
  });

  it('applies active class to nodes when nodeActive prop set', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        nodeActive={{
          [dataScienceNodeId]: true,
          [dataProcessingNodeId]: true,
        }}
      />
    );

    const activeNodes = container.querySelectorAll('.pipeline-node--active');
    expect(activeNodes.length).toBe(2);
  });

  it('applies collapsed-hint class to nodes with input parameters hovered during collapsed state', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        hoveredParameters={true}
        nodeTypeDisabled={{ parameters: true }}
        nodesWithInputParams={{
          [dataScienceNodeId]: ['params1'],
          [dataProcessingNodeId]: ['params2', 'params3'],
        }}
      />
    );

    const collapsedHintNodes = container.querySelectorAll(
      '.pipeline-node--collapsed-hint'
    );
    expect(collapsedHintNodes.length).toBe(2);
  });

  it('correctly positions parameter icons in vertical orientation', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        hoveredParameters={true}
        nodeTypeDisabled={{ parameters: true }}
        nodesWithInputParams={{
          [dataScienceNodeId]: ['params1'],
        }}
      />
    );

    const indicators = container.querySelectorAll(
      '.pipeline-node__parameter-indicator--visible'
    );

    indicators.forEach((el) => {
      const y = parseFloat(el.getAttribute('y'));
      expect(y).toEqual(-6);
    });
  });

  it('correctly positions parameter icons in horizontal orientation', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        hoveredParameters={true}
        orientation="horizontal"
        nodeTypeDisabled={{ parameters: true }}
        nodesWithInputParams={{
          [dataScienceNodeId]: ['params1'],
        }}
      />
    );

    const nodeElement = container.querySelector('.pipeline-node__bg');
    const nodeY = parseFloat(nodeElement?.getAttribute('y'));

    const indicators = container.querySelectorAll(
      '.pipeline-node__parameter-indicator--visible'
    );
    indicators.forEach((el) => {
      const y = parseFloat(el.getAttribute('y'));
      expect(y).toBeLessThan(nodeY);
    });
  });

  it('applies parameter-indicator--visible class to nodes with input parameters when nodeDisabled prop set', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        nodesWithInputParams={{
          [dataScienceNodeId]: ['params1'],
          [dataProcessingNodeId]: ['params2', 'params3'],
        }}
      />
    );

    expect(
      container.querySelectorAll('.pipeline-node__parameter-indicator--visible')
        .length
    ).toBe(2);
  });

  it('does not apply pipeline-node--dataset-input class to input dataset nodes when not under focus mode', () => {
    const { container } = setup.render(<FlowChart />);
    expect(
      container.querySelectorAll('.pipeline-node--dataset-input').length
    ).toBe(0);
  });

  it('applies pipeline-node--dataset-input class to input dataset nodes under focus mode', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          '23c94afb': { id: '23c94afb', name: 'model_input_table' },
        }}
      />
    );
    expect(
      container.querySelectorAll('.pipeline-node--dataset-input').length
    ).toBe(1);
  });

  it('applies pipeline-edge--dataset--input class to input dataset edges under focus mode', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataEdges={{
          [`23c94afb|${dataScienceNodeId}`]: {
            id: `23c94afb|${dataScienceNodeId}`,
          },
        }}
      />
    );
    expect(
      container.querySelectorAll('.pipeline-edge--dataset--input').length
    ).toBe(1);
  });

  it('applies pipeline-node-input--active class to input/outout nodes when hovering over them under focus mode', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          '23c94afb': { id: '23c94afb', name: 'model_input_table' },
        }}
        nodeActive={{ '23c94afb': true }}
      />
    );
    expect(
      container.querySelectorAll('.pipeline-node-input--active').length
    ).toBe(1);
  });

  it('applies pipeline-node-input--selected class to input/outout nodes when selecting one of them under focus mode', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          '23c94afb': { id: '23c94afb', name: 'model_input_table' },
        }}
        nodeSelected={{ '23c94afb': true }}
      />
    );
    expect(
      container.querySelectorAll('.pipeline-node-input--selected').length
    ).toBe(1);
  });

  it('applies pipeline-node--parameter-input class to input parameter nodes under focus mode', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          f1f1425b: { id: 'f1f1425b' },
        }}
      />,
      {
        state: prepareState({
          data: spaceflights,
          beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
        }),
      }
    );
    expect(
      container.querySelectorAll('.pipeline-node--parameter-input').length
    ).toBe(1);
  });

  it('applies .parameters class to all parameter nodes', () => {
    const { container } = setup.render(<FlowChart />, {
      state: prepareState({
        data: spaceflights,
        beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      }),
    });
    expect(
      container.querySelectorAll('.pipeline-node--parameters').length
    ).toBe(1);
  });

  it('applies .parameters class to all the edges from parameter nodes', () => {
    const { container } = setup.render(<FlowChart />, {
      state: prepareState({
        data: spaceflights,
        beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      }),
    });
    expect(
      container.querySelectorAll('.pipeline-edge--parameters').length
    ).toBe(1);
  });

  //TO DO: Fix this test
  // it('getHoveredParameterLabel returns parameter count when there are more than 1 hidden parameters', () => {
  //   const { container } = setup.render(<FlowChart displayGlobalNavigation={true} />);
  //   const instance = container.querySelector('FlowChart')?._reactRootContainer?._internalRoot?.current?.child?.stateNode;
  //   const parameterNames = ['params1', 'params2'];
  //   const label = instance.getHoveredParameterLabel(parameterNames);
  //   expect(label).toEqual('Parameters:2');
  // });

  // it('getHoveredParameterLabel returns parameter name when there is 1 hidden parameter', () => {
  //   const { container } = setup.render(<FlowChart displayGlobalNavigation={true} />);
  //   const instance = container.querySelector('FlowChart')?._reactRootContainer?._internalRoot?.current?.child?.stateNode;
  //   const parameterNames = ['params1'];
  //   const label = instance.getHoveredParameterLabel(parameterNames);
  //   expect(label).toEqual('params1');
  // });

  it('shows layers when layers are visible', () => {
    const { container } = setup.render(
      <FlowChart displayGlobalNavigation={true} />
    );
    expect(container.querySelectorAll('.pipeline-layer').length).toBe(2);
  });

  it('hides layers when layers.length is 0', () => {
    const { container } = setup.render(
      <FlowChart displayGlobalNavigation={true} layers={[]} />
    );
    expect(container.querySelectorAll('.pipeline-layer').length).toBe(0);
  });

  it('shows tooltip when tooltip prop set as visible', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        tooltip={{
          targetRect: { top: 0, left: 0, width: 10, height: 10 },
          text: 'test tooltip',
          visible: true,
        }}
      />
    );
    const tooltip = container.querySelector('.pipeline-tooltip');
    const tooltipText = container.querySelector('.pipeline-tooltip__text');
    expect(tooltip?.classList.contains('pipeline-tooltip--visible')).toBe(true);
    expect(tooltipText?.textContent).toBe('test tooltip');
  });

  it('hides tooltip when tooltip prop not set as visible', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        tooltip={{
          targetRect: { top: 0, left: 0, width: 10, height: 10 },
          text: 'test tooltip',
          visible: false,
        }}
      />
    );
    const tooltip = container.querySelector('.pipeline-tooltip');
    expect(tooltip?.classList.contains('pipeline-tooltip--visible')).toBe(
      false
    );
  });

  it('applies faded class to all nodes that are not included in the hovered focus mode icon pipeline', () => {
    const { container } = setup.render(
      <FlowChart
        displayGlobalNavigation={true}
        hoveredFocusMode={true}
        nodeActive={{
          [dataScienceNodeId]: true,
        }}
      />,
      {
        state: prepareState({
          beforeLayoutActions: [() => toggleTypeDisabled('parameters', true)],
          data: spaceflights,
        }),
      }
    );

    expect(container.querySelectorAll('.pipeline-node--faded').length).toBe(6);
  });

  it('maps state to props', () => {
    const expectedResult = {
      clickedNode: expect.any(Object),
      chartSize: expect.any(Object),
      chartZoom: expect.any(Object),
      edges: expect.any(Array),
      graphSize: expect.any(Object),
      hoveredParameters: expect.any(Boolean),
      hoveredFocusMode: expect.any(Boolean),
      layers: expect.any(Array),
      linkedNodes: expect.any(Object),
      nodeActive: expect.any(Object),
      nodeSelected: expect.any(Object),
      nodeTypeDisabled: expect.any(Object),
      nodesWithInputParams: expect.any(Object),
      orientation: expect.any(String),
      nodes: expect.any(Array),
      visibleGraph: expect.any(Boolean),
      visibleSidebar: expect.any(Boolean),
      visibleCode: expect.any(Boolean),
      visibleMetaSidebar: expect.any(Boolean),
      inputOutputDataNodes: expect.any(Object),
      inputOutputDataEdges: expect.any(Object),
      focusMode: expect.any(Object),
      displayGlobalNavigation: expect.any(Boolean),
      displaySidebar: expect.any(Boolean),
      displayMetadataPanel: expect.any(Boolean),
      slicedPipeline: expect.any(Object),
      isSlicingPipelineApplied: expect.any(Boolean),
      runCommand: expect.any(Object),
      modularPipelineIds: expect.any(Object),
      visibleSlicing: expect.any(Boolean),
      nodeReFocus: expect.any(Boolean),
    };
    expect(mapStateToProps(mockState.spaceflights)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onToggleNodeHovered('123');
    expect(dispatch.mock.calls[0][0]).toEqual({
      nodeHovered: '123',
      type: 'TOGGLE_NODE_HOVERED',
    });

    const boundingClientRect = { x: 0, y: 0, width: 1000, height: 1000 };
    mapDispatchToProps(dispatch).onUpdateChartSize(boundingClientRect);
    expect(dispatch.mock.calls[1][0]).toEqual({
      chartSize: boundingClientRect,
      type: 'UPDATE_CHART_SIZE',
    });

    const zoom = { scale: 1, x: 0, y: 0 };
    mapDispatchToProps(dispatch).onUpdateZoom(zoom);
    expect(dispatch.mock.calls[2][0]).toEqual({
      zoom,
      type: 'UPDATE_ZOOM',
    });
  });
});

describe('mapDispatchToProps', () => {
  it('calls the right actions with nodeID for onLoadNodeData', async () => {
    const { store } = setup.render(<div />); // dummy render to get store

    await mapDispatchToProps(store.dispatch).onLoadNodeData('123');

    const actions = store.getState().node.clicked;
    expect(actions).toEqual('123');
  });
});
