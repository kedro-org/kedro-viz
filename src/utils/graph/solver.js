/** @license kiwi.js v1.1.2
 * #------------------------------------------------------------------------------
 * # Copyright (c) 2013, Nucleic Development Team & H. Rutjes.
 * #
 * # Distributed under the terms of the Modified BSD License.
 * #
 * # The full license is in the file COPYING.txt, distributed with this software.
 * #------------------------------------------------------------------------------
 **/
import { Solver, Variable } from 'kiwi.js';

/**
 * Applies the given constraints to the objects in-place.
 * If `strict` is set, limitations apply but an exact solution is attempted,
 * otherwise a solution is approximated iteratively
 * @param {array} constraints The constraints to apply
 * @param {object} constraint.a The first object to constrain
 * @param {object} constraint.b The second object to constrain
 * @param {string} constraint.base.property The property name on `a` and `b` to constrain
 * @param {?function} constraint.base.solve A function that solves the constraint in-place
 * @param {?function} constraint.base.strict A function returns the constraint in strict form
 * @param {?object} constants The constants used by constraints
 * @param {number=1} iterations The number of iterations
 * @param {boolean=false} strict
 */
export const solve = (
  constraints,
  constants = {},
  iterations = 1,
  strict = false
) => {
  if (strict) return solveStrict(constraints, constants);
  return solveLoose(constraints, constants, Math.ceil(iterations));
};

/**
 * Applies the given constraints to the objects in-place.
 * A solution is approximated iteratively.
 * @param {array} constraints The constraints. See docs for `solve`
 * @param {object} constants The constants used by constraints
 * @param {number} iterations The number of iterations
 */
const solveLoose = (constraints, constants, iterations) => {
  for (let i = 0; i < iterations; i += 1) {
    for (const co of constraints) {
      co.base.solve(co, constants);
    }
  }
};

/**
 * Applies the given constraints to the objects in-place.
 * A solution is found exactly if possible, otherwise throws an error.
 * @param {array} constraints The constraints. See docs for `solve`
 * @param {object} constants The constants used by constraints
 */
const solveStrict = (constraints, constants) => {
  const solver = new Solver();
  const variables = {};

  const variableId = (obj, property) => `${obj.id}_${property}`;

  const addVariable = (obj, property) => {
    const id = variableId(obj, property);

    if (!variables[id]) {
      const variable = (variables[id] = new Variable());
      variable.property = property;
      variable.obj = obj;
    }
  };

  for (const co of constraints) {
    addVariable(co.a, co.base.property);
    addVariable(co.b, co.base.property);
  }

  for (const co of constraints) {
    solver.addConstraint(
      co.base.strict(
        co,
        constants,
        variables[variableId(co.a, co.base.property)],
        variables[variableId(co.b, co.base.property)]
      )
    );
  }

  solver.updateVariables();

  const variablesList = Object.values(variables);

  for (const variable of variablesList) {
    variable.obj[variable.property] = variable.value();
  }
};
