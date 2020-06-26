import { mockState } from '../state.mock';
import { getVisibleNodes } from '../../selectors/nodes';
import { getVisibleEdges } from '../../selectors/edges';
import { getVisibleLayerIDs } from '../../selectors/disabled';
import { graph } from './index';
import { solve, greaterOrEqual, equalTo, subtract } from './solver';

import {
  clamp,
  snap,
  distance1d,
  angle,
  groupByRow,
  nodeLeft,
  nodeRight,
  nodeTop,
  nodeBottom,
  compare,
  offsetEdge,
  offsetNode,
  nearestOnLine
} from './common';

describe('graph', () => {
  const mockNodes = getVisibleNodes(mockState.animals);
  const mockEdges = getVisibleEdges(mockState.animals);
  const mockLayers = getVisibleLayerIDs(mockState.animals);

  const result = graph(mockNodes, mockEdges, mockLayers);

  it('returns a result object with size and input nodes, edges, layers properties', () => {
    expect(result).toEqual(
      expect.objectContaining({
        size: expect.any(Object),
        nodes: mockNodes,
        edges: mockEdges,
        layers: mockLayers
      })
    );
  });

  it('returns a size object with valid required properties', () => {
    expect(result.size.width).toBeGreaterThan(0);
    expect(result.size.height).toBeGreaterThan(0);
  });

  it('sets valid x and y properties on all input nodes', () => {
    result.nodes.forEach(node => {
      expect(node.x).toEqual(expect.any(Number));
      expect(node.y).toEqual(expect.any(Number));
    });
  });

  it('sets valid points property on all input edges', () => {
    result.edges.forEach(edge => {
      expect(edge.points.length).toBeGreaterThanOrEqual(2);

      edge.points.forEach(point => {
        expect(point.x).toEqual(expect.any(Number));
        expect(point.y).toEqual(expect.any(Number));
      });
    });
  });
});

describe('commmon', () => {
  it('clamp returns the value limited between min and max', () => {
    // Covers positive, negative and decimal numbers
    expect(clamp(-1, 0, 1)).toEqual(0);
    expect(clamp(0.5, 0, 1)).toEqual(0.5);
    expect(clamp(2, 0, 1)).toEqual(1);

    expect(clamp(-1.5, -2, -1)).toEqual(-1.5);
    expect(clamp(-5, -2, -1)).toEqual(-2);
    expect(clamp(5, -2, -1)).toEqual(-1);
  });

  it('snap returns a value rounded to the nearest unit value', () => {
    // Covers positive, negative and decimal numbers
    expect(snap(1.25, 1)).toEqual(1);
    expect(snap(1.5, 1)).toEqual(2);
    expect(snap(1.75, 1)).toEqual(2);

    expect(snap(100.1, 1)).toEqual(100);
    expect(snap(100.4, 0.5)).toEqual(100.5);

    expect(snap(11, 10)).toEqual(10);
    expect(snap(9, 10)).toEqual(10);
    expect(snap(0, 10)).toEqual(0);

    expect(snap(-1.25, 1)).toEqual(-1);
    expect(snap(-1.5, 1)).toEqual(-1);
    expect(snap(-1.75, 1)).toEqual(-2);

    expect(snap(-100.1, 1)).toEqual(-100);
    expect(snap(-100.4, 0.5)).toEqual(-100.5);

    expect(snap(-11, 10)).toEqual(-10);
    expect(snap(-9, 10)).toEqual(-10);
    expect(snap(-1, 10)).toEqual(-0);
  });

  it('distance1d returns the absolute distance between values', () => {
    // Covers positive, negative and decimal numbers
    expect(distance1d(0, 0)).toEqual(0);
    expect(distance1d(0, 1)).toEqual(1);
    expect(distance1d(1, 2)).toEqual(1);
    expect(distance1d(0, -1)).toEqual(1);
    expect(distance1d(-1, -2)).toEqual(1);
    expect(distance1d(-0.75, 1.5)).toEqual(2.25);
  });

  it('angle returns the angle between two points relative to x-axis', () => {
    // Degenerate case (coincident)
    expect(angle({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual(0);

    // Same quadrants
    for (let a = -Math.PI; a <= Math.PI; a += Math.PI / 3) {
      const pointA = { x: 2 * Math.cos(a), y: 2 * Math.sin(a) };
      expect(
        angle(pointA, { x: 0.5 * pointA.x, y: 0.5 * pointA.y })
      ).toBeCloseTo(a);
    }

    // Different quadrants
    for (let a = -Math.PI; a <= Math.PI; a += Math.PI / 2) {
      const pointA = { x: Math.cos(a), y: Math.sin(a) };
      expect(angle(pointA, { x: -pointA.x, y: -pointA.y })).toBeCloseTo(a);
    }
  });

  it('groupByRow finds the rows formed by nodes given the their positions in Y sorted in X and Y.', () => {
    const nodes = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 2 },
      { x: 0, y: 4 },
      { x: 3, y: 2 }
    ];

    expect(groupByRow(nodes)).toEqual([
      [{ x: 0, y: 0, row: 0 }, { x: 1, y: 0, row: 0 }],
      [{ x: 0, y: 1, row: 1 }],
      [{ x: 1, y: 2, row: 2 }, { x: 2, y: 2, row: 2 }, { x: 3, y: 2, row: 2 }],
      [{ x: 0, y: 3, row: 3 }],
      [{ x: 0, y: 4, row: 4 }]
    ]);
  });

  it('nodeLeft returns the left edge x-position of the node', () => {
    expect(nodeLeft({ x: 8.5, y: 10, width: 10.5, height: 20.5 })).toEqual(
      3.25
    );
  });

  it('nodeRight returns the right edge x-position of the node', () => {
    expect(nodeRight({ x: 8.5, y: 10, width: 10.5, height: 20.5 })).toEqual(
      13.75
    );
  });

  it('nodeTop returns the top edge y-position of the node', () => {
    expect(nodeTop({ x: 8.5, y: 10, width: 10.5, height: 20.5 })).toEqual(
      -0.25
    );
  });

  it('nodeBottom returns the bottom edge y-position of the node', () => {
    expect(nodeBottom({ x: 8.5, y: 10, width: 10.5, height: 20.5 })).toEqual(
      20.25
    );
  });

  it('compare returns a value < 0 if a < b for numbers', () => {
    expect(compare(-1, 1)).toBeLessThan(0);
  });

  it('compare returns 0 if a === b for numbers', () => {
    expect(compare(1, 1)).toBe(0);
  });

  it('compare returns a value > 0 if a > b for numbers', () => {
    expect(compare(2, 1)).toBeGreaterThan(0);
  });

  it('compare returns a value < 0 if a < b for strings', () => {
    expect(compare('bat', 'cat')).toBeLessThan(0);
  });

  it('compare returns 0 if a === b for strings', () => {
    expect(compare('cat', 'cat')).toBe(0);
  });

  it('compare returns a value > 0 if a > b for strings', () => {
    expect(compare('hat', 'cat')).toBeGreaterThan(0);
  });

  it('compare breaks ties using subsequent arguments', () => {
    // Covers mixed types between pairs
    expect(compare(1, 1, 'hat', 'cat')).toBeGreaterThan(0);
    expect(compare('cat', 'cat', 1, 2)).toBeLessThan(0);
    expect(compare('cat', 'cat', 1, 1, 0, 0)).toBe(0);
    expect(compare(1, 1, 'cat', 'cat', 5, 3)).toBeGreaterThan(0);
    expect(compare('cat', 'cat', 2, 2, -1, 4)).toBeLessThan(0);
  });

  it('offsetNode returns the node with the position translated in-place', () => {
    const node = { x: 5, y: -10 };
    const result = offsetNode(node, { x: 1, y: 2 });
    expect(result).toEqual({ x: 4, y: -12 });
    expect(result).toBe(node);
  });

  it('offsetEdge returns the edge with each point translated in-place', () => {
    const edge = { points: [{ x: 5, y: -10 }, { x: -8, y: 2 }] };
    const result = offsetEdge(edge, { x: 1, y: 2 });
    expect(result).toEqual({ points: [{ x: 4, y: -12 }, { x: -9, y: 0 }] });
    expect(result).toBe(edge);
  });

  it('nearestOnLine returns the point on the line segment `ax, ay, bx, by` closest to point `x, y`', () => {
    // Degenerate case (coincident)
    expect(nearestOnLine(0, 0, 0, 0, 0, 0)).toEqual(
      expect.objectContaining({
        x: 0,
        y: 0
      })
    );

    // Lower limit of segment
    expect(nearestOnLine(-1, -1, 0, 0, 1, 1)).toEqual(
      expect.objectContaining({
        x: 0,
        y: 0
      })
    );

    // Upper limit of segment
    expect(nearestOnLine(2, 2, 0, 0, 1, 1)).toEqual(
      expect.objectContaining({
        x: 1,
        y: 1
      })
    );

    // Mid-point (coincident)
    expect(nearestOnLine(0.5, 0.5, 0, 0, 1, 1)).toEqual(
      expect.objectContaining({
        x: 0.5,
        y: 0.5
      })
    );

    // Below the segment
    expect(nearestOnLine(0.5, 0, 0, 0, 1, 1)).toEqual(
      expect.objectContaining({
        x: 0.25,
        y: 0.25
      })
    );

    // Above the segment
    expect(nearestOnLine(0.5, 1, 0, 0, 1, 1)).toEqual(
      expect.objectContaining({
        x: 0.75,
        y: 0.75
      })
    );
  });
});

describe('solver', () => {
  it('equalTo returns true if a === b otherwise false', () => {
    expect(equalTo(0, 0)).toEqual(true);
    expect(equalTo(1, 0)).toEqual(false);
  });

  it('greaterOrEqual returns true if a >= b otherwise false', () => {
    expect(greaterOrEqual(-1, 0)).toEqual(false);
    expect(greaterOrEqual(0, 0)).toEqual(true);
    expect(greaterOrEqual(1, 0)).toEqual(true);
  });

  it('subtract returns the value a - b', () => {
    expect(subtract(1, 2)).toEqual(-1);
    expect(subtract(2, 1)).toEqual(1);
  });

  it('solve finds a valid solution to given constraints (loose)', () => {
    const testA = { id: 0, x: 0, y: 0 };
    const testB = { id: 1, x: 0, y: 0 };
    const testC = { id: 2, x: 0, y: 0 };

    const constraintBase = {
      distance: distance1d,
      delta: subtract,
      weightA: () => 0.5,
      weightB: () => 0.5,
      strength: () => 1
    };

    const constraintXA = {
      ...constraintBase,
      a: testA,
      b: testB,
      key: 'x',
      operator: equalTo,
      target: () => 5
    };

    const constraintXB = {
      ...constraintBase,
      a: testB,
      b: testC,
      key: 'x',
      operator: greaterOrEqual,
      target: () => 8
    };

    const constraintXC = {
      ...constraintBase,
      a: testA,
      b: testC,
      key: 'x',
      operator: greaterOrEqual,
      target: () => 20
    };

    const constraintYA = {
      ...constraintBase,
      a: testA,
      b: testC,
      key: 'y',
      operator: equalTo,
      target: () => 5
    };

    const constraintYB = {
      ...constraintBase,
      a: testB,
      b: testC,
      key: 'y',
      operator: greaterOrEqual,
      target: () => 1
    };

    const constraintYC = {
      ...constraintBase,
      a: testB,
      b: testA,
      key: 'y',
      operator: equalTo,
      target: () => 100
    };

    solve(
      [
        constraintXA,
        constraintXB,
        constraintXC,
        constraintYA,
        constraintYB,
        constraintYC
      ],
      8,
      false
    );

    expect(Math.abs(testA.x - testB.x)).toBeCloseTo(5);
    expect(Math.abs(testB.x - testC.x)).toBeGreaterThanOrEqual(8);
    expect(Math.abs(testA.x - testC.x)).toBeGreaterThanOrEqual(20);

    expect(Math.abs(testA.y - testC.y)).toBeCloseTo(5);
    expect(Math.abs(testB.y - testC.y)).toBeGreaterThanOrEqual(1);
    expect(Math.abs(testA.y - testB.y)).toBeCloseTo(100);
  });

  it('solve finds a valid solution to given constraints (strict)', () => {
    const testA = { id: 0, x: 0, y: 0 };
    const testB = { id: 1, x: 0, y: 0 };
    const testC = { id: 2, x: 0, y: 0 };

    const constraintBase = {
      distance: subtract,
      delta: subtract,
      weightA: () => 0.5,
      weightB: () => 0.5,
      strength: () => 1,
      required: true
    };

    const constraintXA = {
      ...constraintBase,
      a: testA,
      b: testB,
      key: 'x',
      operator: equalTo,
      target: () => 5
    };

    const constraintXB = {
      ...constraintBase,
      a: testB,
      b: testC,
      key: 'x',
      operator: greaterOrEqual,
      target: () => 8
    };

    const constraintXC = {
      ...constraintBase,
      a: testA,
      b: testC,
      key: 'x',
      operator: greaterOrEqual,
      target: () => 20
    };

    const constraintYA = {
      ...constraintBase,
      a: testA,
      b: testC,
      key: 'y',
      operator: equalTo,
      target: () => 5
    };

    const constraintYB = {
      ...constraintBase,
      a: testB,
      b: testC,
      key: 'y',
      operator: greaterOrEqual,
      target: () => 1
    };

    const constraintYC = {
      ...constraintBase,
      a: testB,
      b: testA,
      key: 'y',
      operator: equalTo,
      target: () => 100
    };

    solve(
      [
        constraintXA,
        constraintXB,
        constraintXC,
        constraintYA,
        constraintYB,
        constraintYC
      ],
      1,
      true
    );

    expect(Math.abs(testA.x - testB.x)).toEqual(5);
    expect(Math.abs(testB.x - testC.x)).toBeGreaterThanOrEqual(8);
    expect(Math.abs(testA.x - testC.x)).toBeGreaterThanOrEqual(20);

    expect(Math.abs(testA.y - testC.y)).toEqual(5);
    expect(Math.abs(testB.y - testC.y)).toBeGreaterThanOrEqual(1);
    expect(Math.abs(testA.y - testB.y)).toEqual(100);
  });
});
