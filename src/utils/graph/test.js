const createSeparationConstraints = (rows, constants) => {
    const { spaceX, spaceY } = constants;
    const separationConstraints = [];
  
    // For each row of nodes
    for (let i = 0; i < rows.length - 1; i += 1) {
      const rowNodes = rows[i];
      const nodeB = rows[i + 1][0];
  
      // Stable sort row nodes horizontally, breaks ties with ids
      rowNodes.sort((a, b) => compare(a.y, b.y, a.id, b.id));
  
      // Update constraints given updated row node order
      for (let j = 0; j < rowNodes.length; j += 1) {
        const nodeA = rowNodes[j];
        const nodeC = j + 1 < rowNodes.length ? rowNodes[j + 1] : null;
  
        // Count the connected edges
        const degreeA = Math.max(
          1,
          nodeA.targets.length + nodeA.sources.length - 2
        );
        const degreeB = Math.max(
          1,
          nodeB.targets.length + nodeB.sources.length - 2
        );
        if (nodeC) {
          const degreeC = Math.max(
            1,
            nodeC.targets.length + nodeC.sources.length - 2
          );
          // Allow more spacing for nodes with more edges
          const spreadInX = Math.min(10, degreeA * degreeC * constants.spreadX);
          const spaceInX = snap(spreadInX * spaceX, spaceX);
  
          separationConstraints.push({
            base: { property: 'x', ...separationConstraint },
            a: nodeA,
            b: nodeC,
            separation: nodeA.height + spaceInX + nodeC.height,
          });
        }
  
        // Allow more spacing for nodes with more edges
        const spreadInY = Math.min(10, degreeA * degreeB * constants.spreadX);
        const spaceInY = snap(spreadInY * spaceY, spaceY);
  
        separationConstraints.push({
          base: { property: 'y', ...separationConstraint },
          a: nodeA,
          b: nodeB,
          separation: nodeA.width * 0.5 + spaceInY + nodeB.width * 0.5,
        });
      }
    }
  
    return separationConstraints;
  };
  