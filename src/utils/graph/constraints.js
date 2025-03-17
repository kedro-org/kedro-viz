/**
 * Constraint base definitions.
 *
 * Refer to LAYOUT_ENGINE.md for descriptions of each constraint.
 *
 * See `solve` function of `solver.js` for constraint specification.
 */

import { Constraint, Operator, Strength } from 'kiwi.js';

/**
 * Layout constraint for separating rows
 */
export const rowConstraint = {
  strict: (constraint, layoutConfig, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Ge,
      constraint.separation,
      Strength.required
    ),
};

/**
 * Layout constraint for separating layers
 */
export const layerConstraint = {
  strict: (constraint, layoutConfig, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Ge,
      layoutConfig.layerSpace,
      Strength.required
    ),
};

/**
 * Layout constraint for minimising distance from source to target for straight edges
 */
export const parallelConstraint = {
  solve: (constraint, layoutConfig) => {
    const { a, b, strength } = constraint;
    const resolve =
      strength * (a[constraint.property] - b[constraint.property]);
    a[constraint.property] -= resolve;
    b[constraint.property] += resolve;
  },

  strict: (constraint, layoutConfig, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Eq,
      0,
      Strength.create(1, 0, 0, constraint.strength)
    ),
};

/**
 * Crossing constraint for minimising edge crossings
 */
export const crossingConstraint = {
  solve: (constraint, layoutConfig) => {
    const { edgeA, edgeB, separationA, separationB, strength } = constraint;

    // Amount to move each node towards required separation
    const resolveSource =
      strength *
      ((edgeA.sourceNode[constraint.property] -
        edgeB.sourceNode[constraint.property] -
        separationA) /
        separationA);

    const resolveTarget =
      strength *
      ((edgeA.targetNode[constraint.property] -
        edgeB.targetNode[constraint.property] -
        separationB) /
        separationB);

    // Apply the resolve each node
    edgeA.sourceNode[constraint.property] -= resolveSource;
    edgeB.sourceNode[constraint.property] += resolveSource;
    edgeA.targetNode[constraint.property] -= resolveTarget;
    edgeB.targetNode[constraint.property] += resolveTarget;
  },
};

/**
 * Layout constraint for minimum node separation
 */
export const separationConstraint = {
  strict: (constraint, layoutConfig, variableA, variableB) =>
    new Constraint(
      variableB.minus(variableA),
      Operator.Ge,
      constraint.separation,
      Strength.required
    ),
};
