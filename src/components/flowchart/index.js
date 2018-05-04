import React, { Component } from 'react';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
// import { scaleOrdinal } from 'd3-scale';
import { zoom, zoomIdentity } from 'd3-zoom';
import dagre from 'dagre';
import database from './database.svg';
import './flowchart.css';

const shorten = (text, n) => (text.length > n ? text.substr(0, n) + '…' : text);

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
    this.setupChart();
    this.drawChart();
    this.zoomChart();
  }

  componentWillUnmount() {
    document.removeEventListener('resize', this.setChartHeight);
  }

  componentDidUpdate(newProps) {
    this.drawChart();
    if (newProps.textLabels !== this.props.textLabels) {
      this.zoomChart(true);
    }
  }

  setChartHeight() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.el.svg.attr('width', this.width).attr('height', this.height);
  }

  setupChart() {
    // Initialize zoom behaviour
    this.zoomBehaviour = zoom().on('zoom', () => {
      this.el.inner.attr('transform', event.transform);
    });
    this.el.svg.call(this.zoomBehaviour);
  }

  // Update node and link data
  getLayout() {
    const { data, textLabels } = this.props;

    this.graph = new dagre.graphlib.Graph().setGraph({
      marginx: 40,
      marginy: 40
    });

    data.nodes.forEach(d => {
      if (d.disabled) {
        // this.graph.removeNode(d.id);
      } else {
        this.graph.setNode(d.id, {
          ...d,
          label: d.name,
          width: 50,
          height: 50
        });
      }
    });

    data.links.forEach(d => {
      if (d.source.disabled || d.target.disabled) {
        // this.graph.removeEdge(d.source.id, d.target.id);
      } else {
        this.graph.setEdge(d.source.id, d.target.id, {
          source: d.source,
          target: d.target
        });
      }
    });

    // Run Dagre layout to calculate X/Y positioning
    dagre.layout(this.graph);

    // Map to data arrays
    return {
      nodes: this.graph
        .nodes()
        .map(d => this.graph.node(d))
        .filter(d => d.x && d.y),
      edges: this.graph.edges().map(d => {
        const edge = this.graph.edge(d);
        edge.id = [edge.source.id, edge.target.id].join('-');
        return edge;
      })
    };
  }

  zoomChart(isUpdate) {
    // Zoom and scale to fit
    const { width, height } = this.graph.graph();
    const zoomScale = Math.min(this.width / width, this.height / height);
    const translateX = this.width / 2 - width * zoomScale / 2;
    const translateY = this.height / 2 - height * zoomScale / 2;
    const svgZoom = isUpdate
      ? this.el.svg.transition().duration(500)
      : this.el.svg;
    svgZoom.call(
      this.zoomBehaviour.transform,
      zoomIdentity.translate(translateX, translateY).scale(zoomScale)
    );
  }

  drawChart() {
    const data = this.getLayout();

    // const delay = (d, i) => 600 + i * 20;

    // Create selections
    this.el.edges = this.el.edgeGroup
      .selectAll('.edge')
      .data(data.edges, d => d.id);

    this.el.nodes = this.el.nodeGroup
      .selectAll('.node')
      .data(data.nodes, d => d.id);

    const tt = this.toggleTooltip();

    // Create arrowhead marker
    this.el.edgeGroup
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('class', 'flowchart__arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 7)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 L 4 5 z');

    // Set up line shape function
    const lineShape = line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(curveBasis);

    // Create edges
    const enterEdges = this.el.edges
      .enter()
      .append('g')
      .attr('class', 'edge');

    enterEdges
      .append('path')
      .attr('marker-end', d => `url(#arrowhead)`)
      .attr('d', d => lineShape(d.points));

    this.el.edges
      .select('path')
      .transition()
      .attr('d', d => lineShape(d.points));

    this.el.edges.exit().remove();

    // Create nodes

    const updateNodes = nodes =>
      nodes
        .classed('node--highlighted', d => d.highlighted)
        .on('mouseover', tt.show)
        .on('mousemove', tt.show)
        .on('mouseout', tt.hide);

    const enterNodes = this.el.nodes
      .enter()
      .append('g')
      .attr('class', 'node');

    enterNodes
      .attr('opacity', 0)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .call(updateNodes)
      // .transition()
      // .delay(delay)
      // .duration(800)
      .attr('opacity', 1);

    enterNodes.append('circle').attr('r', 25);

    enterNodes
      .append('image')
      .attr('xlink:href', database)
      .attr('width', 18)
      .attr('height', 18)
      .attr('x', -9)
      .attr('y', -9)
      .attr('alt', d => d.name);

    this.el.nodes
      .call(updateNodes)
      .transition()
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    this.el.nodes.exit().remove();
  }

  toggleTooltip() {
    const { nodes, edges, tooltip } = this.el;
    return {
      show: d => {
        const { clientX, clientY } = event;
        const isRight = clientX > this.width / 2;
        const x = isRight ? clientX - this.width : clientX;

        const linkedNodes = this.getLinkedNodes(d.id);

        tooltip
          .classed('tooltip--visible', true)
          .classed('tooltip--right', isRight)
          .html(`<b>${d.name}</b><small>${d.layer.name}</small>`)
          .style('transform', `translate(${x}px, ${clientY}px)`);

        nodes
          .classed(
            'node--highlighted',
            dd => linkedNodes.includes(dd.id) || dd.id === d.id
          )
          .classed(
            'node--faded',
            dd => !linkedNodes.includes(+dd.id) && dd.id !== d.id
          );

        edges.classed('edge--faded', ({ source, target }) =>
          [source.id, target.id].some(
            dd => !linkedNodes.includes(+dd) && dd !== d.id
          )
        );
      },

      hide: () => {
        edges.classed('edge--faded', false);
        nodes.classed('node--highlighted', false).classed('node--faded', false);
        tooltip.classed('tooltip--visible', false);
      }
    };
  }

  getLinkedNodes(nodeID) {
    const { links } = this.props.data;
    const linkedNodes = [];

    (function getParents(id) {
      links.filter(d => d.target.id === id).forEach(d => {
        linkedNodes.push(d.source.id);
        getParents(d.source.id);
      });
    })(+nodeID);

    (function getChildren(id) {
      links.filter(d => d.source.id === id).forEach(d => {
        linkedNodes.push(d.target.id);
        getChildren(d.target.id);
      });
    })(+nodeID);

    return linkedNodes;
  }

  render() {
    return (
      <div className="flowchart">
        <svg className="flowchart__graph" ref={el => (this._svg = el)}>
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
