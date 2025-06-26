import { graph } from './graph';
import { VIEW } from '../../config';

/**
 * Calculate chart layout with experimental new graphing algorithm
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const graphNew = ({
  nodes,
  edges,
  layers,
  orientation,
  view,
  workflowNodeDetailsWidth,
}) => {
  for (const node of nodes) {
    node.iconSize = node.iconSize || 24;
    node.icon = node.icon || 'node';
    const fullName =
      (node && node.fullName && node.fullName.length) ||
      (node && node.name && node.name.length);

    const padding = { x: 20, y: 10 };
    const textWidth = fullName * 7;
    const textGap = 6;
    const innerWidth = node.iconSize + textWidth + textGap;

    let baseWidth = node.width || innerWidth + padding.x * 2;
    // Only apply workflowNodeDetailsWidth if in workflow view and the value is a valid number
    node.width =
      view === VIEW.WORKFLOW && typeof workflowNodeDetailsWidth === 'number'
        ? Math.max(baseWidth, workflowNodeDetailsWidth)
        : baseWidth;

    node.height = node.height || node.iconSize + padding.y * 2;
    node.textOffset = node.textOffset || (innerWidth - textWidth) / 2;
    node.iconOffset = node.iconOffset || -innerWidth / 2;
  }

  const result = graph(nodes, edges, layers, orientation, view);

  return {
    ...result,
    size: { ...result.size, marginx: 100, marginy: 100 },
  };
};
