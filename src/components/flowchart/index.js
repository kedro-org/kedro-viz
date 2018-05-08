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
      if (!d.disabled) {
        this.graph.setNode(d.id, {
          ...d,
          label: d.name,
          width: textLabels ? d.name.length * 7 + 40 : 50,
          height: 50
        });
      }
    });

    data.edges.forEach(d => {
      if (!d.source.disabled && !d.target.disabled) {
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
      ? this.el.svg.transition().duration(300)
      : this.el.svg;
    svgZoom.call(
      this.zoomBehaviour.transform,
      zoomIdentity.translate(translateX, translateY).scale(zoomScale)
    );
  }

  drawChart() {
    const { onNodeUpdate, textLabels } = this.props;
    const data = this.getLayout();

    // Create selections
    this.el.edges = this.el.edgeGroup
      .selectAll('.edge')
      .data(data.edges, d => d.id);

    this.el.nodes = this.el.nodeGroup
      .selectAll('.node')
      .data(data.nodes, d => d.id);

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

    this.el.edges.exit().remove();

    this.el.edges = this.el.edges.merge(enterEdges);

    this.el.edges
      .select('path')
      .transition()
      .attr('d', d => lineShape(d.points));

    // Create nodes
    const enterNodes = this.el.nodes
      .enter()
      .append('g')
      .attr('class', 'node');

    enterNodes.append('circle').attr('r', 25);

    enterNodes
      .append('image')
      .attr('xlink:href', database)
      .attr('width', 18)
      .attr('height', 18)
      .attr('x', -9)
      .attr('y', -9)
      .attr('alt', d => d.name);

    enterNodes.append('rect');

    enterNodes
      .append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5);

    this.el.nodes.exit().remove();

    this.el.nodes = this.el.nodes
      .merge(enterNodes)
      .classed('node--icon', !textLabels)
      .classed('node--text', textLabels)
      .classed('node--active', d => d.active)
      .on('mouseover', d => {
        onNodeUpdate(d.id, 'active', true);
        this.tooltip().show(d);
        this.linkedNodes().show(d);
      })
      .on('mousemove', d => {
        this.tooltip().show(d);
      })
      .on('mouseout', d => {
        onNodeUpdate(d.id, 'active', false);
        this.linkedNodes().hide(d);
        this.tooltip().hide(d);
      });

    this.el.nodes
      .transition()
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .select('rect')
      .attr('width', d => d.width - 5)
      .attr('height', d => d.height - 5)
      .attr('x', d => (d.width - 5) / -2)
      .attr('y', d => (d.height - 5) / -2);
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
        tooltip
          .classed('tooltip--visible', true)
          .classed('tooltip--right', isRight)
          .html(`<b>${d.name}</b><small>${d.layer.name}</small>`)
          .style('transform', `translate(${x}px, ${clientY}px)`);
      },

      hide: () => {
        tooltip.classed('tooltip--visible', false);
      }
    };
  }

  /**
   * Provide methods to highlight linked nodes on hover,
   * and fade non-linked nodes
   */
  linkedNodes() {
    const { nodes, edges } = this.el;

    return {
      show: d => {
        const linkedNodes = this.getLinkedNodes(d.id);

        nodes
          .classed(
            'node--active',
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
        nodes.classed('node--active', false).classed('node--faded', false);
      }
    };
  }

  getLinkedNodes(nodeID) {
    const { edges } = this.props.data;
    const linkedNodes = [];

    (function getParents(id) {
      edges.filter(d => d.target.id === id).forEach(d => {
        linkedNodes.push(d.source.id);
        getParents(d.source.id);
      });
    })(+nodeID);

    (function getChildren(id) {
      edges.filter(d => d.source.id === id).forEach(d => {
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
