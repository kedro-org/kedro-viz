import { groupByRow } from './layout';

import {
  compare,
  distance1d,
  angle,
  nearestOnLine,
  nodeLeft,
  nodeRight,
  nodeTop,
  nodeBottom
} from './common';

const routing = ({
  nodes,
  edges,
  spaceX,
  spaceY,
  tension,
  minNodeGap,
  stemUnit,
  stemMinSource,
  stemMinTarget,
  stemMax,
  stemSpaceSource,
  stemSpaceTarget
}) => {
  const rows = groupByRow(nodes);

  for (const node of nodes) {
    node.targets.sort((a, b) =>
      compare(
        Math.atan2(
          b.sourceNode.y - b.targetNode.y,
          b.sourceNode.x - b.targetNode.x !== 0
            ? b.sourceNode.x - b.targetNode.x
            : (b.targetNode.row % 2 === 0 ? -1 : 1) *
                Math.pow(b.targetNode.row - b.sourceNode.row, 3)
        ),
        Math.atan2(
          a.sourceNode.y - a.targetNode.y,
          a.sourceNode.x - a.targetNode.x !== 0
            ? a.sourceNode.x - a.targetNode.x
            : (a.targetNode.row % 2 === 0 ? -1 : 1) *
                Math.pow(a.targetNode.row - a.sourceNode.row, 3)
        )
      )
    );
  }

  for (const edge of edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;

    const sourceSeparation = Math.min(
      (source.width - stemSpaceSource) / source.targets.length,
      stemSpaceSource
    );

    const targetSeparation = Math.min(
      (target.width - stemSpaceTarget) / target.sources.length,
      stemSpaceTarget
    );

    const sourceEdgeDistance =
      source.targets.indexOf(edge) - (source.targets.length - 1) * 0.5;
    const targetEdgeDistance =
      target.sources.indexOf(edge) - (target.sources.length - 1) * 0.5;

    const sourceOffsetX = sourceSeparation * sourceEdgeDistance;
    const targetOffsetX = targetSeparation * targetEdgeDistance;

    const startPoint = { x: source.x + sourceOffsetX, y: source.y };
    const endPoint = { x: target.x + targetOffsetX, y: target.y };
    let currentPoint = startPoint;

    edge.points = [];

    for (let l = source.row + 1; l < target.row; l += 1) {
      const firstNode = rows[l][0];
      let upperPoint = { x: nodeLeft(firstNode) - spaceX, y: firstNode.y };
      let nearestDistance = Infinity;

      const rowExtended = [
        { ...firstNode, x: Number.MIN_SAFE_INTEGER },
        ...rows[l],
        { ...firstNode, x: Number.MAX_SAFE_INTEGER }
      ];

      for (let i = 0; i < rowExtended.length - 1; i += 1) {
        const node = rowExtended[i];
        const nextNode = rowExtended[i + 1];
        const nodeGap = nodeLeft(nextNode) - nodeRight(node);

        if (nodeGap < minNodeGap) continue;

        const gradient =
          (endPoint.x - currentPoint.x) / (endPoint.y - currentPoint.y) || 1;
        const smoothGradient =
          (currentPoint.gradient || gradient) * 0.5 + gradient * 0.5;
        const offsetX = Math.min(spaceX, nodeGap * 0.5);
        const offsetY = nodeTop(node) - spaceY - currentPoint.y;

        const tensionForce =
          tension / Math.pow(distance1d(node.y, endPoint.y), 2);
        const tensionOffset = tensionForce * smoothGradient * offsetY;

        const candidatePoint = nearestOnLine(
          currentPoint.x + tensionOffset,
          currentPoint.y,
          nodeRight(node) + offsetX,
          nodeTop(node) - spaceY,
          nodeLeft(nextNode) - offsetX,
          nodeTop(nextNode) - spaceY
        );

        const distance = distance1d(currentPoint.x, candidatePoint.x);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          upperPoint = candidatePoint;
          upperPoint.gradient = gradient;
        }
      }

      const gradient =
        (endPoint.x - upperPoint.x) / (endPoint.y - upperPoint.y) || 1;
      const smoothGradient = upperPoint.gradient * 0.5 + gradient * 0.5;
      const offsetY = firstNode.height + 2 * spaceY;

      const tensionForce =
        tension / Math.pow(distance1d(upperPoint.y, endPoint.y), 2);
      const tensionOffset = tensionForce * smoothGradient * offsetY;

      const lowerPoint = nearestOnLine(
        upperPoint.x + tensionOffset,
        upperPoint.y,
        upperPoint.ax,
        upperPoint.ay + offsetY,
        upperPoint.bx,
        upperPoint.by + offsetY
      );

      edge.points.push({ x: upperPoint.x + sourceOffsetX, y: upperPoint.y });
      edge.points.push({ x: lowerPoint.x + sourceOffsetX, y: lowerPoint.y });

      currentPoint = {
        x: lowerPoint.x,
        y: lowerPoint.y,
        gradient: smoothGradient
      };
    }
  }

  for (const node of nodes) {
    node.targets.sort((a, b) =>
      compare(
        angle(b.sourceNode, b.points[0] || b.targetNode),
        angle(a.sourceNode, a.points[0] || a.targetNode)
      )
    );
    node.sources.sort((a, b) =>
      compare(
        angle(a.points[a.points.length - 1] || a.sourceNode, a.targetNode),
        angle(b.points[b.points.length - 1] || b.sourceNode, b.targetNode)
      )
    );
  }

  for (const edge of edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;

    const sourceSeparation = Math.min(
      (source.width - stemSpaceSource) / source.targets.length,
      stemSpaceSource
    );

    const targetSeparation = Math.min(
      (target.width - stemSpaceTarget) / target.sources.length,
      stemSpaceTarget
    );

    const sourceEdgeDistance =
      source.targets.indexOf(edge) - (source.targets.length - 1) * 0.5;
    const targetEdgeDistance =
      target.sources.indexOf(edge) - (target.sources.length - 1) * 0.5;

    const sourceOffsetX = sourceSeparation * sourceEdgeDistance;
    const targetOffsetX = targetSeparation * targetEdgeDistance;

    const sourceOffsetY =
      stemUnit *
      source.targets.length *
      (1 - Math.abs(sourceEdgeDistance) / source.targets.length);

    const targetOffsetY =
      stemUnit *
      target.sources.length *
      (1 - Math.abs(targetEdgeDistance) / target.sources.length);

    const sourcePoints = [
      {
        x: source.x + sourceOffsetX,
        y: nodeBottom(source)
      },
      {
        x: source.x + sourceOffsetX,
        y: nodeBottom(source) + stemMinSource
      },
      {
        x: source.x + sourceOffsetX,
        y: nodeBottom(source) + stemMinSource + Math.min(sourceOffsetY, stemMax)
      }
    ];

    const targetPoints = [
      {
        x: target.x + targetOffsetX,
        y: nodeTop(target) - stemMinTarget - Math.min(targetOffsetY, stemMax)
      },
      {
        x: target.x + targetOffsetX,
        y: nodeTop(target) - stemMinTarget
      },
      {
        x: target.x + targetOffsetX,
        y: nodeTop(target)
      }
    ];

    edge.points = [...sourcePoints, ...edge.points, ...targetPoints];
  }
};

export { routing };
