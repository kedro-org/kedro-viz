import { MINIMUM_DETAILS_WIDTH } from './config';

export function getNodeWidth(node) {
  return Math.max(node.width - 5, MINIMUM_DETAILS_WIDTH);
}
