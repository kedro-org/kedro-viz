import React, { Component } from 'react';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
// import { scaleOrdinal } from 'd3-scale';
import { zoom, zoomIdentity } from 'd3-zoom';
import dagre from 'dagre';
import linkedNodes from './linked-nodes';
import imgCog from './cog.svg';
import imgDatabase from './database.svg';
import './flowchart.css';

/**
 * Get unique, reproducible ID for each edge, based on its nodes
 * @param {Object} edge - An edge datum
 */
const edgeID = edge => [edge.source.id, edge.target.id].join('-');

const DURATION = 666;

class FlowChart extends Component {
  constructor(props) {
    super(props);
    this.setChartHeight = this.setChartHeight.bind(this);
  }

  componentDidMount() {
    // Select d3 elements
    this.el = {
      svg: select(this._svg),
      inner: select(this._gInner),
      edgeGroup: select(this._gEdges),
      nodeGroup: select(this._gNodes),
      tooltip: select(this._tooltip)
    };

    this.setChartHeight();
    window.addEventListener('resize', this.setChartHeight);
    this.initZoomBehaviour();
    this.getLayout();
    this.drawChart();
    this.zoomChart();
    this.checkNodeCount();
  }

  componentWillUnmount() {
    document.removeEventListener('resize', this.setChartHeight);
  }

  componentDidUpdate(prevProps) {
    const rezoom = prevProps.textLabels !== this.props.textLabels;
    const updateView = prevProps.view !== this.props.view;
    const updateParams = prevProps.parameters !== this.props.parameters;
    const updateNodeCount = this.checkNodeCount();
    const update = rezoom || updateView || updateParams || updateNodeCount;

    if (update) {
      this.getLayout();
    }

    this.drawChart();

    if (update) {
      this.zoomChart(true);
    }
  }

  setChartHeight() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.el.svg.attr('width', this.width).attr('height', this.height);
  }

  initZoomBehaviour() {
    this.zoomBehaviour = zoom().on('zoom', () => {
      this.el.inner.attr('transform', event.transform);
    });
    this.el.svg.call(this.zoomBehaviour);
  }

  /**
   * Calculate node/edge positoning, using dagre layout algorithm.
   * This is expensive and should only be run if the layout needs changing,
   * but not when just highlighting active nodes.
   */
  getLayout() {
    const { data, textLabels } = this.props;

    this.graph = new dagre.graphlib.Graph().setGraph({
      marginx: 40,
      marginy: 40
    });

    // Temporarily append text element to the DOM, to measure its width
    const textWidth = (name, padding) => {
      const text = this.el.nodeGroup.append('text').text(name);
      const bbox = text.node().getBBox();
      text.remove();
      return bbox.width + padding;
    };

    data.nodes.forEach(d => {
      if (!this.filter().node(d)) {
        return;
      }

      const nodeWidth = d.type === 'data' ? 50 : 40;

      this.graph.setNode(d.id, {
        ...d,
        label: d.name,
        width: textLabels ? textWidth(d.name, nodeWidth) : nodeWidth,
        height: nodeWidth
      });
    });

    data.edges.forEach(d => {
      if (!this.filter().edge(d)) {
        return;
      }
      this.graph.setEdge(d.source.id, d.target.id, {
        source: d.source,
        target: d.target
      });
    });

    // Run Dagre layout to calculate X/Y positioning
    dagre.layout(this.graph);

    // Map to objects
    this.layout = {
      nodes: this.graph
        .nodes()
        .map(d => this.graph.node(d))
        .reduce((nodes, node) => {
          nodes[node.id] = node;
          return nodes;
        }, {}),

      edges: this.graph.edges().reduce((edges, d) => {
        const edge = this.graph.edge(d);
        edge.id = edgeID(edge);
        edges[edge.id] = edge;
        return edges;
      }, {})
    };
  }

  /**
   * Keep a count of the number of nodes on screen,
   * and return true if the number of visible nodes has changed,
   * indicating that the dagre layout should be updated
   */
  checkNodeCount() {
    const newNodeCount = this.props.data.nodes.filter(d => !d.disabled).length;
    if (newNodeCount !== this.nodeCount) {
      this.nodeCount = newNodeCount;
      return true;
    }
    return false;
  }

  /**
   * Zoom and scale to fit
   * @param {Boolean} isUpdate - Whether chart is updating and should be animated
   */
  zoomChart(isUpdate) {
    const { width, height } = this.graph.graph();
    const zoomScale = Math.min(this.width / width, this.height / height);
    const translateX = this.width / 2 - width * zoomScale / 2;
    const translateY = this.height / 2 - height * zoomScale / 2;
    const svgZoom = isUpdate
      ? this.el.svg.transition().duration(DURATION)
      : this.el.svg;
    svgZoom.call(
      this.zoomBehaviour.transform,
      zoomIdentity.translate(translateX, translateY).scale(zoomScale)
    );
  }

  filter() {
    const param = d => d.id.includes('param');

    return {
      edge: d => {
        const { parameters, view } = this.props;
        if (d.source.disabled || d.target.disabled) {
          return false;
        }
        if (!parameters && (param(d.source) || param(d.target))) {
          return false;
        }
        if (view === 'combined') {
          return d.source.type !== d.target.type;
        }
        return view === d.source.type && view === d.target.type;
      },
      node: d => {
        const { parameters, view } = this.props;
        if (d.disabled) {
          return false;
        }
        if (!parameters && param(d)) {
          return false;
        }
        return view === 'combined' || view === d.type;
      }
    };
  }

  /**
   * Combine dagre layout with updated data from props
   */
  prepareData() {
    const { data } = this.props;

    return {
      edges: data.edges.filter(this.filter().edge).map(d => ({
        ...this.layout.edges[edgeID(d)],
        ...d
      })),

      nodes: data.nodes.filter(this.filter().node).map(d => ({
        ...this.layout.nodes[d.id],
        ...d
      }))
    };
  }

  drawChart() {
    const { onNodeUpdate, textLabels } = this.props;
    const data = this.prepareData();

    // Create selections
    this.el.edges = this.el.edgeGroup
      .selectAll('.edge')
      .data(data.edges, d => d.id);

    this.el.nodes = this.el.nodeGroup
      .selectAll('.node')
      .data(data.nodes, d => d.id);

    // Set up line shape function
    const lineShape = line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(curveBasis);

    // Create edges
    const enterEdges = this.el.edges
      .enter()
      .append('g')
      .attr('class', 'edge')
      .attr('opacity', 0);

    enterEdges.append('path').attr('marker-end', d => `url(#arrowhead)`);

    this.el.edges
      .exit()
      .transition('exit-edges')
      .duration(DURATION)
      .attr('opacity', 0)
      .remove();

    this.el.edges = this.el.edges.merge(enterEdges);

    this.el.edges
      .transition('show-edges')
      .duration(DURATION)
      .attr('opacity', 1);

    this.el.edges
      .select('path')
      .transition('update-edges')
      .duration(DURATION)
      .each(d => {
        if (lineShape(d.points).includes('NaN'))
          console.log(d, lineShape(d.points));
      })
      .attr('d', d => lineShape(d.points));

    // Create nodes
    const enterNodes = this.el.nodes
      .enter()
      .append('g')
      .attr('class', 'node');

    enterNodes
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .attr('opacity', 0);

    enterNodes.append('circle').attr('r', 25);

    enterNodes.append('rect');

    const imageSize = d => Math.round(d.height * 0.36);

    enterNodes
      .append('image')
      .attr('xlink:href', d => (d.type === 'data' ? imgDatabase : imgCog))
      .attr('width', imageSize)
      .attr('height', imageSize)
      .attr('x', d => imageSize(d) / -2)
      .attr('y', d => imageSize(d) / -2)
      .attr('alt', d => d.name);

    enterNodes
      .append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5);

    this.el.nodes
      .exit()
      .transition('exit-nodes')
      .duration(DURATION)
      .attr('opacity', 0)
      .remove();

    this.el.nodes = this.el.nodes
      .merge(enterNodes)
      .classed('node--data', d => d.type === 'data')
      .classed('node--task', d => d.type === 'task')
      .classed('node--icon', !textLabels)
      .classed('node--text', textLabels)
      .classed('node--active', d => d.active)
      .on('mouseover', d => {
        onNodeUpdate(d.id, 'active', true);
        this.tooltip().show(d);
        linkedNodes(this).show(d);
      })
      .on('mousemove', d => {
        this.tooltip().show(d);
      })
      .on('mouseout', d => {
        onNodeUpdate(d.id, 'active', false);
        linkedNodes(this).hide(d);
        this.tooltip().hide(d);
      });

    this.el.nodes
      .transition('update-nodes')
      .duration(DURATION)
      .attr('opacity', 1)
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    this.el.nodes
      .select('rect')
      .attr('width', d => d.width - 5)
      .attr('height', d => d.height - 5)
      .attr('x', d => (d.width - 5) / -2)
      .attr('y', d => (d.height - 5) / -2)
      .attr('rx', d => (d.type === 'data' ? d.height / 2 : 0));
  }

  /**
   * Provide methods to show/hide the tooltip
   */
  tooltip() {
    const { tooltip } = this.el;

    return {
      show: d => {
        const { clientX, clientY } = event;
        const isRight = clientX > this.width / 2;
        const x = isRight ? clientX - this.width : clientX;
        let label = `<b>${d.name}</b>`;
        if (d.layer) {
          label += `<small>${d.layer.name}</small>`;
        }
        tooltip
          .classed('tooltip--visible', true)
          .classed('tooltip--right', isRight)
          .html(label)
          .style('transform', `translate(${x}px, ${clientY}px)`);
      },

      hide: () => {
        tooltip.classed('tooltip--visible', false);
      }
    };
  }

  render() {
    return (
      <div className="flowchart">
        <svg className="flowchart__graph" ref={el => (this._svg = el)}>
          <defs>
            <marker
              id="arrowhead"
              className="flowchart__arrowhead"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerUnits="strokeWidth"
              markerWidth="8"
              markerHeight="6"
              orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 L 4 5 z" />
            </marker>
          </defs>
          <g ref={el => (this._gInner = el)}>
            <g className="flowchart__edges" ref={el => (this._gEdges = el)} />
            <g className="flowchart__nodes" ref={el => (this._gNodes = el)} />
          </g>
        </svg>
        <div className="flowchart__tooltip" ref={el => (this._tooltip = el)} />
      </div>
    );
  }
}

export default FlowChart;
