import React from 'react';
import select from 'cheerio';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import FlowChart, {
  mapStateToProps,
  mapDispatchToProps,
  chartSizeTestFallback,
} from './flowchart';
import { mockState, setup } from '../../utils/state.mock';
import { getViewTransform, getViewExtents, origin } from '../../utils/view';
import { getVisibleNodeIDs } from '../../selectors/disabled';
import { getNodeLabel } from '../../selectors/nodes';
import { toggleTypeDisabled } from '../../actions/node-type';

const chartWidth = chartSizeTestFallback.width;
const chartHeight = chartSizeTestFallback.height;

const dataScienceNodeId = 'data_science';
const dataProcessingNodeId = 'data_processing';

const mockChartSize = (
  chartSize,
  width = chartWidth,
  height = chartHeight
) => ({
  left: 0,
  top: 0,
  outerWidth: width,
  outerHeight: height,
  height,
  width,
  minWidthScale: 1,
  sidebarWidth: 0,
  metaSidebarWidth: 0,
  codeSidebarWidth: 0,
  ...chartSize,
});

describe('FlowChart', () => {
  it('renders without crashing', () => {
    const svg = setup
      .mount(<FlowChart displayGlobalNavigation={true} />)
      .find('svg');
    expect(svg.length).toEqual(1);
    expect(svg.hasClass('pipeline-flowchart__graph')).toBe(true);
  });

  it('renders nodes with D3', () => {
    const wrapper = setup.mount(<FlowChart displayGlobalNavigation={true} />);
    const nodes = wrapper.render().find('.pipeline-node');
    const nodeNames = nodes.map((i, el) => select(el).text()).get();
    const mockNodes = getVisibleNodeIDs(mockState.spaceflights);
    const mockNodeNames = mockNodes.map(
      (d) => getNodeLabel(mockState.spaceflights)[d]
    );
    expect(nodes.length).toEqual(mockNodes.length);
    expect(nodeNames.sort()).toEqual(mockNodeNames.sort());
  });

  it('a transform to fit the graph in container was applied', () => {
    const wrapper = setup.mount(<FlowChart displayGlobalNavigation={true} />);
    const instance = wrapper.find('FlowChart').instance();
    const viewTransform = getViewTransform(instance.view);

    // Sanity checks only due to limited test environment
    // View logic is directly covered in view utility tests

    // Should not be the default transform
    expect(viewTransform).not.toEqual(origin);

    // Should have offset
    expect(viewTransform.x).toBeLessThan(0);
    expect(viewTransform.y).toBe(0);

    // Should have scale
    expect(viewTransform.k).not.toEqual(origin.k);
    expect(viewTransform.k).toBeGreaterThan(0);
  });

  it('applies expected view extents when all sidebars closed', () => {
    // Simulate closed sidebars
    const chartSize = mockChartSize({
      sidebarWidth: 0,
      metaSidebarWidth: 0,
      codeSidebarWidth: 0,
    });

    const wrapper = setup.mount(
      <FlowChart displayGlobalNavigation={true} chartSize={chartSize} />
    );
    const instance = wrapper.find('FlowChart').instance();
    const viewExtents = getViewExtents(instance.view);

    const margin = instance.MARGIN;
    const minScale = instance.MIN_SCALE;
    const maxScale = instance.MAX_SCALE;

    // Assert expected constants
    expect(margin).toEqual(500);
    expect(minScale).toEqual(0.8);
    expect(maxScale).toEqual(2);

    const { width: chartWidth, height: chartHeight } = chartSize;
    const { width: graphWidth, height: graphHeight } = instance.props.graphSize;

    // Translate extent should only include margin and graph size
    expect(viewExtents.translate.minX).toEqual(-margin);
    expect(viewExtents.translate.minY).toEqual(-margin);
    expect(viewExtents.translate.maxX).toEqual(graphWidth + margin);
    expect(viewExtents.translate.maxY).toEqual(graphHeight + margin);

    // The scale at which the full graph in view
    const fullScale = Math.min(
      chartWidth / (graphWidth || 1),
      chartHeight / (graphHeight || 1)
    );

    // Scale extent should allow full graph in view
    expect(viewExtents.scale.minK).toBeLessThanOrEqual(fullScale);
    expect(viewExtents.scale.maxK).toEqual(maxScale);
  });

  it('applies expected view extents when all sidebars open', () => {
    // Simulate open sidebars
    const chartSize = mockChartSize({
      sidebarWidth: 150,
      metaSidebarWidth: 180,
      codeSidebarWidth: 255,
    });

    const wrapper = setup.mount(
      <FlowChart displayGlobalNavigation={true} chartSize={chartSize} />
    );
    const instance = wrapper.find('FlowChart').instance();
    const viewExtents = getViewExtents(instance.view);

    const margin = instance.MARGIN;
    const minScale = instance.MIN_SCALE;
    const maxScale = instance.MAX_SCALE;

    // Assert expected constants
    expect(margin).toEqual(500);
    expect(minScale).toEqual(0.8);
    expect(maxScale).toEqual(2);

    const {
      width: chartWidth,
      height: chartHeight,
      sidebarWidth,
      metaSidebarWidth,
      codeSidebarWidth,
    } = chartSize;

    const { width: graphWidth, height: graphHeight } = instance.props.graphSize;

    const leftSidebarOffset = sidebarWidth;
    const rightSidebarOffset = metaSidebarWidth + codeSidebarWidth;

    // Translate extent should include left and right sidebars, margin and graph size
    expect(viewExtents.translate.minX).toEqual(-margin - leftSidebarOffset);
    expect(viewExtents.translate.minY).toEqual(-margin);
    expect(viewExtents.translate.maxX).toEqual(
      graphWidth + margin + rightSidebarOffset
    );
    expect(viewExtents.translate.maxY).toEqual(graphHeight + margin);

    // The scale at which the full graph in view
    const fullScale = Math.min(
      chartWidth / (graphWidth || 1),
      chartHeight / (graphHeight || 1)
    );

    // Scale extent should allow full graph in view
    expect(viewExtents.scale.minK).toBeLessThanOrEqual(fullScale);
    expect(viewExtents.scale.maxK).toEqual(maxScale);
  });

  it('resizes the chart if the window resizes', () => {
    const map = {};
    window.addEventListener = jest.fn((event, callback) => {
      map[event] = callback;
    });
    const wrapper = setup.mount(<FlowChart displayGlobalNavigation={true} />);
    const spy = jest.spyOn(
      wrapper.find('FlowChart').instance(),
      'updateChartSize'
    );
    map.resize();
    expect(spy).toHaveBeenCalled();
  });

  it('applies transform correctly for different orientations', () => {
    const chartSize = mockChartSize({
      sidebarWidth: 0,
      metaSidebarWidth: 0,
      codeSidebarWidth: 0,
    });

    const wrapperVertical = setup.mount(
      <FlowChart
        chartSize={chartSize}
        displayGlobalNavigation={true}
        orientation="vertical"
      />
    );
    const wrapperHorizontal = setup.mount(
      <FlowChart
        chartSize={chartSize}
        displayGlobalNavigation={true}
        orientation="horizontal"
      />
    );

    const instanceVertical = wrapperVertical.find('FlowChart').instance();
    const instanceHorizontal = wrapperHorizontal.find('FlowChart').instance();

    const viewTransformVertical = getViewTransform(instanceVertical.view);
    const viewTransformHorizontal = getViewTransform(instanceHorizontal.view);

    expect(viewTransformVertical.y).toBe(0);
    expect(viewTransformHorizontal.x).toBe(0);
  });

  it('applies expected view extents for different orientations', () => {
    const chartSize = mockChartSize({
      sidebarWidth: 0,
      metaSidebarWidth: 0,
      codeSidebarWidth: 0,
    });

    const wrapperVertical = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        chartSize={chartSize}
        orientation="vertical"
      />
    );
    const wrapperHorizontal = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        chartSize={chartSize}
        orientation="horizontal"
      />
    );

    const instanceVertical = wrapperVertical.find('FlowChart').instance();
    const instanceHorizontal = wrapperHorizontal.find('FlowChart').instance();

    const viewExtentsVertical = getViewExtents(instanceVertical.view);
    const viewExtentsHorizontal = getViewExtents(instanceHorizontal.view);

    // Verify vertical orientation behavior
    expect(viewExtentsVertical.translate.minX).toBe(-instanceVertical.MARGIN);
    expect(viewExtentsVertical.translate.maxX).toEqual(
      instanceVertical.props.graphSize.width + instanceVertical.MARGIN
    );
    expect(viewExtentsVertical.translate.minY).toEqual(
      -instanceVertical.MARGIN
    );
    expect(viewExtentsVertical.translate.maxY).toEqual(
      instanceVertical.props.graphSize.height + instanceVertical.MARGIN
    );

    // Verify horizontal orientation behavior
    expect(viewExtentsHorizontal.translate.minX).toEqual(
      -instanceHorizontal.MARGIN
    );
    expect(viewExtentsHorizontal.translate.maxX).toEqual(
      instanceHorizontal.props.graphSize.width + instanceHorizontal.MARGIN
    );
    expect(viewExtentsHorizontal.translate.minY).toEqual(
      -instanceHorizontal.MARGIN
    );
    expect(viewExtentsHorizontal.translate.maxY).toEqual(
      instanceHorizontal.props.graphSize.height + instanceHorizontal.MARGIN
    );
  });

  it('removes the resize event listener on unmount', () => {
    const map = {};
    window.addEventListener = jest.fn((event, callback) => {
      map[event] = callback;
    });
    window.removeEventListener = jest.fn((event) => {
      delete map[event];
    });
    const wrapper = setup.mount(<FlowChart />);
    const instance = wrapper.find('FlowChart').instance();
    const spy = jest.spyOn(instance, 'componentWillUnmount');
    const spy2 = jest.spyOn(instance, 'updateChartSize');
    expect(map.resize).toBeDefined();
    wrapper.unmount();
    expect(map.resize).toBeUndefined();
    if (map.resize) {
      map.resize();
    }
    expect(spy).toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });

  it('does not throw an error/warning when no data is displayed', () => {
    // Setup
    const originalConsole = console;
    console.warn = jest.fn();
    console.error = jest.fn();
    // Test
    const emptyData = { data: { nodes: [], edges: [] } };
    expect(() => setup.mount(<FlowChart />, emptyData)).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    // Teardown
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('applies selected class to nodes when nodeSelected prop set', () => {
    const wrapper = setup.mount(
      <FlowChart
        nodeSelected={{
          [dataScienceNodeId]: true,
          [dataProcessingNodeId]: true,
        }}
      />
    );
    expect(wrapper.render().find('.pipeline-node--selected').length).toBe(2);
  });

  it('applies active class to nodes when nodeActive prop set', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        nodeActive={{
          [dataScienceNodeId]: true,
          [dataProcessingNodeId]: true,
        }}
      />
    );
    expect(wrapper.render().find('.pipeline-node--active').length).toBe(2);
  });

  it('applies collapsed-hint class to nodes with input parameters are hovered during collapsed state', () => {
    const wrapper = setup.mount(
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
    expect(wrapper.render().find('.pipeline-node--collapsed-hint').length).toBe(
      2
    );
  });

  it('correctly positions parameter icons in vertical orientation', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        hoveredParameters={true}
        nodeTypeDisabled={{ parameters: true }}
        nodesWithInputParams={{
          [dataScienceNodeId]: ['params1'],
        }}
      />
    );

    const nodeRects = wrapper
      .render()
      .find('.pipeline-node__parameter-indicator--visible');
    nodeRects.each((i, el) => {
      const y = parseFloat(select(el).attr('y'));
      expect(y).toEqual(-6);
    });
  });

  it('correctly positions parameter icons in horizontal orientation', () => {
    const wrapper = setup.mount(
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

    // Find the corresponding pipeline node for `params1`
    const nodeElement = wrapper.render().find(`.pipeline-node__bg`);
    const nodeY = parseFloat(select(nodeElement).attr('y'));

    const nodeRects = wrapper
      .render()
      .find('.pipeline-node__parameter-indicator--visible');
    nodeRects.each((i, el) => {
      const y = parseFloat(select(el).attr('y'));
      expect(y).toBeLessThan(nodeY);
    });
  });

  it('applies parameter-indicator--visible class to nodes with input parameters when nodeDisabled prop set', () => {
    const wrapper = setup.mount(
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
      wrapper.render().find('.pipeline-node__parameter-indicator--visible')
        .length
    ).toBe(2);
  });

  it('does not apply pipeline-node--dataset-input class to input dataset nodes when not under focus mode', () => {
    const wrapper = setup.mount(<FlowChart />);
    expect(wrapper.render().find('.pipeline-node--dataset-input').length).toBe(
      0
    );
  });

  it('applies pipeline-node--dataset-input class to input dataset nodes under focus mode', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          '23c94afb': { id: '23c94afb', name: 'model_input_table' },
        }}
      />
    );
    expect(wrapper.render().find('.pipeline-node--dataset-input').length).toBe(
      1
    );
  });

  it('applies pipeline-edge--dataset--input class to input dataset edges under focus mode', () => {
    const wrapper = setup.mount(
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
    expect(wrapper.render().find('.pipeline-edge--dataset--input').length).toBe(
      1
    );
  });

  it('applies pipeline-node-input--active class to input/outout nodes when hovering over them under focus mode', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          '23c94afb': { id: '23c94afb', name: 'model_input_table' },
        }}
        nodeActive={{
          '23c94afb': true,
        }}
      />
    );
    expect(wrapper.render().find('.pipeline-node-input--active').length).toBe(
      1
    );
  });

  it('applies pipeline-node-input--selected class to input/outout nodes when selecting one of them under focus mode', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        nodeTypeDisabled={{ parameters: true }}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          '23c94afb': { id: '23c94afb', name: 'model_input_table' },
        }}
        nodeSelected={{
          '23c94afb': true,
        }}
      />
    );
    expect(wrapper.render().find('.pipeline-node-input--selected').length).toBe(
      1
    );
  });

  it('applies pipeline-node--parameter-input class to input parameter nodes under focus mode', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        focusMode={{ id: dataScienceNodeId }}
        inputOutputDataNodes={{
          f1f1425b: { id: 'f1f1425b' },
        }}
      />,
      {
        beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
      }
    );
    expect(
      wrapper.render().find('.pipeline-node--parameter-input').length
    ).toBe(1);
  });

  it('applies .parameters class to all parameter nodes', () => {
    //Parameters are enabled here to override the default behavior
    const wrapper = setup.mount(<FlowChart />, {
      beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
    });
    expect(wrapper.render().find('.pipeline-node--parameters').length).toBe(1);
  });

  it('applies .parameters class to all the edges from parameter nodes', () => {
    const wrapper = setup.mount(<FlowChart />, {
      //Parameters are enabled here to override the default behavior
      beforeLayoutActions: [() => toggleTypeDisabled('parameters', false)],
    });
    expect(wrapper.render().find('.pipeline-edge--parameters ').length).toBe(1);
  });

  it('getHoveredParameterLabel returns parameter count when there are more than 1 hidden parameters ', () => {
    const wrapper = setup.mount(<FlowChart displayGlobalNavigation={true} />);
    const parameterNames = ['params1', 'params2'];
    const instance = wrapper.find('FlowChart').instance();
    const label = instance.getHoveredParameterLabel(parameterNames);
    expect(label).toEqual('Parameters:2');
  });

  it('getHoveredParameterLabel returns parameter name when there is 1 hidden parameter ', () => {
    const wrapper = setup.mount(<FlowChart displayGlobalNavigation={true} />);
    const parameterNames = ['params1'];
    const instance = wrapper.find('FlowChart').instance();
    const label = instance.getHoveredParameterLabel(parameterNames);
    expect(label).toEqual('params1');
  });

  it('shows layers when layers are visible', () => {
    const wrapper = setup.mount(<FlowChart displayGlobalNavigation={true} />);
    expect(wrapper.render().find('.pipeline-layer').length).toBe(2);
  });

  it('hides layers when layers.length is 0', () => {
    const wrapper = setup.mount(
      <FlowChart displayGlobalNavigation={true} layers={[]} />
    );
    expect(wrapper.render().find('.pipeline-layer').length).toBe(0);
  });

  it('shows tooltip when tooltip prop set as visible', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        tooltip={{
          targetRect: { top: 0, left: 0, width: 10, height: 10 },
          text: 'test tooltip',
          visible: true,
        }}
      />
    );

    const tooltip = wrapper.render().find('.pipeline-tooltip');
    const tooltipText = wrapper.render().find('.pipeline-tooltip__text');
    expect(tooltip.hasClass('pipeline-tooltip--visible')).toBe(true);
    expect(tooltipText.text()).toBe('test tooltip');
  });

  it('hides tooltip when tooltip prop not set as visible', () => {
    const wrapper = setup.mount(
      <FlowChart
        displayGlobalNavigation={true}
        tooltip={{
          targetRect: { top: 0, left: 0, width: 10, height: 10 },
          text: 'test tooltip',
          visible: false,
        }}
      />
    );

    const tooltip = wrapper.render().find('.pipeline-tooltip');
    expect(tooltip.hasClass('pipeline-tooltip--visible')).toBe(false);
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

describe('map dispatch props to async actions', () => {
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);

  const store = mockStore(mockState.json);

  it('calls the right actions with nodeID for onLoadNodeData', async () => {
    await mapDispatchToProps(store.dispatch).onLoadNodeData('123');
    expect(store.getActions()[0]).toEqual({
      nodeClicked: '123',
      type: 'TOGGLE_NODE_CLICKED',
    });
  });
});

it('applies faded class to all nodes that are not included in the hovered focus mode icon pipeline', () => {
  const wrapper = setup.mount(
    <FlowChart
      displayGlobalNavigation={true}
      hoveredFocusMode={true}
      nodeActive={{
        [dataScienceNodeId]: true,
      }}
    />,
    {
      beforeLayoutActions: [() => toggleTypeDisabled('parameters', true)],
    }
  );
  expect(wrapper.render().find('.pipeline-node--faded').length).toBe(6);
});
