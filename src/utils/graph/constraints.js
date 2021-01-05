import { greaterOrEqual, equalTo } from './solver';

/**
 * Constraint in Y for separating rows
 */
export const rowConstraint = {
  key: 'y',
  operator: greaterOrEqual,
  target: (a, b, co) => co.spaceY,
  strength: () => 1,
  weightA: () => 0,
  weightB: () => 1,
  required: true
};

/**
 * Constraint in Y for separating layers
 */
export const layerConstraint = {
  key: 'y',
  operator: greaterOrEqual,
  target: (a, b, co) => co.layerSpace,
  strength: () => 1,
  weightA: () => 0,
  weightB: () => 1,
  required: false
};

/**
 * Constraint in X for minimising distance from source to target for straight edges
 */
export const parallelConstraint = {
  key: 'x',
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
 * Constraint in X for minimising edge crossings
 */
export const crossingConstraint = {
  key: 'x',
  operator: (distance, target, delta) =>
    target >= 0 ? delta >= target : delta <= target,
  target: (a, b, co) => {
    // Find the minimal target position that separates both nodes
    const sourceDelta = co.edgeA.sourceNode.x - co.edgeB.sourceNode.x;
    const targetDelta = co.edgeA.targetNode.x - co.edgeB.targetNode.x;
    return sourceDelta + targetDelta < 0 ? -co.basisX : co.basisX;
  },
  strength: co => 1 / co.basisX,
  weightA: () => 0.5,
  weightB: () => 0.5,
  required: false
};

/**
 * Constraint in X for minimum node separation (loose)
 */
export const separationConstraint = {
  key: 'x',
  operator: (distance, target, delta) => delta <= target,
  target: (ax, bx, co) => -co.spaceX - co.a.width * 0.5 - co.b.width * 0.5,
  strength: () => 1,
  weightA: () => 0.5,
  weightB: () => 0.5,
  required: false
};

/**
 * Constraint in X for minimum node separation (strict)
 */
export const separationStrictConstraint = {
  key: 'x',
  operator: greaterOrEqual,
  target: (ax, bx, co) => co.targetSeparation,
  strength: () => 1,
  weightA: () => 0,
  weightB: () => 1,
  required: true
};
