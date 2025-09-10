// Utility functions extracted from KedroRunManager
// Place this file in a shared utils directory, e.g. src/components/runner/runner-utils.js

// NOTE: YAML helpers (toYamlString, parseYamlishValue) moved to utils/yamlUtils.js

export function formatParamValueForCli(value) {
  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  if (typeof value === 'string') {
    const needsQuotes = /[\s,]/.test(value);
    const escaped = value.replace(/"/g, '\\"');
    return needsQuotes ? `"${escaped}"` : escaped;
  }
  return JSON.stringify(value);
}

export function normalizeParamPrefix(text) {
  if (!text) {
    return '';
  }
  try {
    return String(text).replace(/^params:/, '');
  } catch (e) {
    return text;
  }
}

export function buildDiffObject(orig, edited) {
  const isObj = (val) => val && typeof val === 'object' && !Array.isArray(val);
  const equal = (a, b) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (e) {
      return a === b;
    }
  };
  if (isObj(orig) && isObj(edited)) {
    const diff = {};
    const keys = new Set([
      ...Object.keys(orig || {}),
      ...Object.keys(edited || {}),
    ]);
    keys.forEach((key) => {
      const origVal = orig[key];
      const editedVal = edited[key];
      if (isObj(origVal) && isObj(editedVal)) {
        const child = buildDiffObject(origVal, editedVal);
        if (child && (typeof child !== 'object' || Object.keys(child).length)) {
          diff[key] = child;
        }
      } else if (
        !equal(origVal, editedVal) &&
        typeof editedVal !== 'undefined'
      ) {
        diff[key] = editedVal;
      }
    });
    return diff;
  }
  // For arrays or primitives, if changed, return the edited value; otherwise undefined
  return equal(orig, edited) ? undefined : edited;
}

export function collectParamDiffs(orig, edited, prefix) {
  const pairs = [];
  if (typeof orig === 'undefined') {
    if (typeof edited === 'undefined') {
      return pairs;
    }
    if (edited && typeof edited === 'object' && !Array.isArray(edited)) {
      Object.keys(edited).forEach((k) => {
        const val = edited[k];
        const keyPath = `${prefix}.${k}`;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          pairs.push(...collectParamDiffs(undefined, val, keyPath));
        } else {
          pairs.push(`${keyPath}=${formatParamValueForCli(val)}`);
        }
      });
    } else {
      pairs.push(`${prefix}=${formatParamValueForCli(edited)}`);
    }
    return pairs;
  }
  if (
    orig &&
    typeof orig === 'object' &&
    !Array.isArray(orig) &&
    edited &&
    typeof edited === 'object' &&
    !Array.isArray(edited)
  ) {
    const keys = new Set([...Object.keys(orig), ...Object.keys(edited)]);
    keys.forEach((k) => {
      const origVal = orig[k];
      const editedVal = edited[k];
      if (typeof editedVal === 'undefined') {
        return; // ignore deletions for now
      }
      const keyPath = `${prefix}.${k}`;
      if (
        origVal &&
        typeof origVal === 'object' &&
        !Array.isArray(origVal) &&
        editedVal &&
        typeof editedVal === 'object' &&
        !Array.isArray(editedVal)
      ) {
        pairs.push(...collectParamDiffs(origVal, editedVal, keyPath));
      } else if (JSON.stringify(origVal) !== JSON.stringify(editedVal)) {
        pairs.push(`${keyPath}=${formatParamValueForCli(editedVal)}`);
      }
    });
    return pairs;
  }
  if (JSON.stringify(orig) !== JSON.stringify(edited)) {
    pairs.push(`${prefix}=${formatParamValueForCli(edited)}`);
  }
  return pairs;
}

export function quoteIfNeeded(text) {
  if (!text) {
    return '';
  }
  const str = String(text);
  return str.includes(' ') ? `"${str.replace(/"/g, '\\"')}"` : str;
}
