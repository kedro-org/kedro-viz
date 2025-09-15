// Parameter diff & CLI formatting helpers centralised for reuse.

export const quoteIfNeeded = (text) => {
  if (!text) {
    return '';
}
  const str = String(text);
  return /\s/.test(str) ? `"${str.replace(/"/g, '\\"')}"` : str;
};

export const normalizeParamPrefix = (text) => {
  if (text == null || text === '') {
    return '';
}
  try {
    return String(text).replace(/^params:/, '');
  } catch {
    return text;
  }
};

export const formatParamValueForCli = (value) => {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'string') {
    const needsQuotes = /[\s,]/.test(value);
    const escaped = value.replace(/"/g, '\\"');
    return needsQuotes ? `"${escaped}"` : escaped;
  }
  return JSON.stringify(value);
};

export const collectParamDiffs = (orig, edited, prefix) => {
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
    orig && typeof orig === 'object' && !Array.isArray(orig) &&
    edited && typeof edited === 'object' && !Array.isArray(edited)
  ) {
    const keys = new Set([...Object.keys(orig), ...Object.keys(edited)]);
    keys.forEach((k) => {
      const origVal = orig[k];
      const editedVal = edited[k];
      if (typeof editedVal === 'undefined') { // deletions ignored for --params format
        return;
    } 
      const keyPath = `${prefix}.${k}`;
      if (
        origVal && typeof origVal === 'object' && !Array.isArray(origVal) &&
        editedVal && typeof editedVal === 'object' && !Array.isArray(editedVal)
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
};

// Build richer diff model for UI (optional future use)
export const buildParamDiffModel = (key, displayName, original, edited) => {
  const prefix = normalizeParamPrefix(displayName || key);
  return {
    key,
    name: displayName || key,
    original,
    edited,
    pairs: collectParamDiffs(original, edited, prefix),
  };
};
