// Shared YAML helper utilities for runner features
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

export const toYamlString = (value) => {
  try {
    return yamlStringify(value, { indent: 2, lineWidth: 0 });
  } catch {
    return String(value);
  }
};

export const parseYamlishValue = (text) => {
  if (text == null) {
    return '';
  }
  const str = String(text);
  if (!str.trim()) {
    return '';
  }
  try {
    return yamlParse(str);
  } catch {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }
};

const yamlUtils = { toYamlString, parseYamlishValue };
export default yamlUtils;
