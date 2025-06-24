import { NODE_DETAILS_WIDTH } from './config';

export function getNodeWidth(node) {
  return Math.max(node.width - 5, NODE_DETAILS_WIDTH);
}
