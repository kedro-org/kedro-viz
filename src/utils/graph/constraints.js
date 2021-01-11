import { distance1d, greaterOrEqual, equalTo, subtract } from './common';

/**
 * Constraint base definitions.
 *
 * See `solve` function of `solver.js` for constraint specification.
 */

/**
 * Layout constraint in Y for separating rows
 */
export const rowConstraint = {
  property: 'y',
  difference: subtract,
  distance: distance1d,
  operator: greaterOrEqual,
  target: (a, b, co, constants) => constants.spaceY,
  strength: () => 1,
  weightA: () => 0,
  weightB: () => 1,
  required: true
};

/**
 * Layout constraint in Y for separating layers
 */
export const layerConstraint = {
  property: 'y',
  difference: subtract,
  distance: distance1d,
  operator: greaterOrEqual,
  target: (a, b, co, constants) => constants.layerSpace,
  strength: () => 1,
  weightA: () => 0,
  weightB: () => 1,
  required: false
};

/**
 * Layout constraint in X for minimising distance from source to target for straight edges
 */
export const parallelConstraint = {
  property: 'x',
  difference: subtract,
  distance: distance1d,
  operator: equalTo,
  target: () => 0,
  // Lower degree nodes can be moved more freely than higher
  strength: co =>
    1 / Math.max(1, 0.5 * (co.a.targets.length + co.b.sources.length)),
  weightA: () => 0.5,
  weightB: () => 0.5,
  required: false
};

/**
 * Layout constraint in X for minimising edge crossings
 */
export const crossingConstraint = {
  property: 'x',
  difference: subtract,
  distance: distance1d,
  operator: (distance, target, difference) =>
    target >= 0 ? difference >= target : difference <= target,
  target: (a, b, co, constants) => {
    // Find the minimal target position that separates both nodes
    const sourceDelta = co.edgeA.sourceNode.x - co.edgeB.sourceNode.x;
    const targetDelta = co.edgeA.targetNode.x - co.edgeB.targetNode.x;
    return sourceDelta + targetDelta < 0 ? -constants.basisX : constants.basisX;
  },
  strength: (co, constants) => 1 / constants.basisX,
  weightA: () => 0.5,
  weightB: () => 0.5,
  required: false
};

/**
 * Layout constraint in X for minimum node separation (loose)
 */
export const separationConstraint = {
  property: 'x',
  difference: subtract,
  distance: distance1d,
  operator: (distance, target, difference) => difference <= target,
  target: (ax, bx, co, constants) =>
    -constants.spaceX - co.a.width * 0.5 - co.b.width * 0.5,
  strength: () => 1,
  weightA: () => 0.5,
  weightB: () => 0.5,
  required: false
};

/**
 * Layout constraint in X for minimum node separation (strict)
 */
export const separationStrictConstraint = {
  property: 'x',
  difference: subtract,
  distance: distance1d,
  operator: greaterOrEqual,
  target: (ax, bx, co) => co.separation,
  strength: () => 1,
  weightA: () => 0,
  weightB: () => 1,
  required: true
};
