/**
 * Constraint base definitions.
 *
 * Refer to LAYOUT_ENGINE.md for descriptions of each constraint.
 *
 * See `solve` function of `solver.js` for constraint specification.
 */

import { Constraint, Operator, Strength } from 'kiwi.js';

/**
 * Layout constraint in Y for separating rows
 */
export const rowConstraint = {
  strict: (constraint, constants, variableA, variableB) =>
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
  strict: (constraint, constants, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Ge,
      constants.layerSpace,
      Strength.required
    ),
};

/**
 * Layout constraint in X for minimising distance from source to target for straight edges
 */
export const parallelConstraint = {

  solve: (constraint, constants) => {
    const { a, b, strength } = constraint;
    const resolve = strength * (a[constants.coordPrimary] - b[constants.coordPrimary]);
    a[constants.coordPrimary] -= resolve;
    b[constants.coordPrimary] += resolve;
  },

  strict: (constraint, constants, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Eq,
      0,
      Strength.create(1, 0, 0, constraint.strength)
    ),
};

/**
 * Crossing constraint in X for minimising edge crossings
 */
export const crossingConstraint = {

  solve: (constraint, constants) => {
    const { edgeA, edgeB, separationA, separationB, strength } = constraint;

    // Amount to move each node towards required separation
    const resolveSource =
      strength *
      ((edgeA.sourceNode[constants.coordPrimary] - edgeB.sourceNode[constants.coordPrimary] - separationA) / separationA);

    const resolveTarget =
      strength *
      ((edgeA.targetNode[constants.coordPrimary] - edgeB.targetNode[constants.coordPrimary] - separationB) / separationB);

    // Apply the resolve each node
    edgeA.sourceNode[constants.coordPrimary] -= resolveSource;
    edgeB.sourceNode[constants.coordPrimary] += resolveSource;
    edgeA.targetNode[constants.coordPrimary] -= resolveTarget;
    edgeB.targetNode[constants.coordPrimary] += resolveTarget;
  },
};

/**
 * Layout constraint in X for minimum node separation
 */
export const separationConstraint = {

  strict: (constraint, constants, variableA, variableB) =>
    new Constraint(
      variableB.minus(variableA),
      Operator.Ge,
      constraint.separation,
      Strength.required
    ),
};
