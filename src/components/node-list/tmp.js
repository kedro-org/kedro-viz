// const renderModularPipelines = (treeData, parentStatus) => {
//   // this value is needed to determine whether the children modular pipeline belongs to a parent under focusMode
//   const status =
//     parentStatus === false && treeData.id !== 'main'
//       ? parentStatus
//       : treeData.disabled;

//   return treeData.children.map((node) =>
//     renderTree(
//       node,
//       onItemMouseEnter,
//       onItemMouseLeave,
//       onItemChange,
//       onItemClick,
//       status,
//       treeData.id
//     )
//   );
// };

// const renderChildNodes = (treeData) =>
//   treeData.nodes.map((node) => (
//     <NodeListTreeItem
//       data={node}
//       onItemMouseEnter={onItemMouseEnter}
//       onItemMouseLeave={onItemMouseLeave}
//       onItemChange={onItemChange}
//       onItemClick={onItemClick}
//       key={node.id}
//       focusMode={focusMode}
//     />
//   ));

// const renderTree = (
//   rowData,
//   onItemMouseEnter,
//   onItemMouseLeave,
//   onItemChange,
//   onItemClick,
//   parentDisabled,
//   parentPipeline
// ) => (
//   <NodeListTreeItem
//     data={rowData}
//     onItemMouseEnter={onItemMouseEnter}
//     onItemMouseLeave={onItemMouseLeave}
//     onItemChange={onItemChange}
//     onItemClick={onItemClick}
//     key={rowData.id}
//     focusMode={focusMode}
//     parentPipeline={parentPipeline}
//     parentDisabled={parentDisabled}>
//     {/* {renderModularPipelines(rowData, parentDisabled)} */}

//     {/* render set of node elements in that modular pipeline */}
//     {renderChildNodes(rowData)}
//   </NodeListTreeItem>
// );
// const [expandedPipelines, setExpandedPipelines] = useState([]);

// useEffect(() => {
//   const filteredTreeItems =
//     searchValue !== ''
//       ? getFilteredTreeItems({
//           nodes,
//           modularPipelines,
//           nodeSelected,
//           searchValue,
//           modularPipelineIds,
//           nodeModularPipelines,
//           nodeTypeIDs,
//           focusMode,
//           inputOutputDataNodes,
//         })
//       : [];

//   let expandedModularPipelines = [];

//   searchValue !== '' &&
//     filteredTreeItems.forEach((modularPipeline) =>
//       expandedModularPipelines.push(modularPipeline.id)
//     );
//   setExpandedPipelines(expandedModularPipelines);
// }, [
//   searchValue,
//   nodes,
//   modularPipelines,
//   nodeSelected,
//   modularPipelineIds,
//   nodeModularPipelines,
//   nodeTypeIDs,
//   focusMode,
//   inputOutputDataNodes,
// ]);

// const treeData = getNestedModularPipelines({
//   nodes,
//   modularPipelines,
//   nodeSelected,
//   searchValue,
//   modularPipelineIds,
//   nodeModularPipelines,
//   nodeTypeIDs,
//   focusMode,
//   inputOutputDataNodes,
// });
/**
 * returns the corresponding filtered parent modular pipelines
 * for each filtered node
 */
// export const getFilteredNodeModularPipelines = createSelector(
//   [
//     getFilteredNodeItems,
//     (state) => state.modularPipelines,
//     (state) => state.nodeTypeIDs,
//     (state) => state.focusMode,
//   ],
//   (filteredNodeItems, modularPipelines, nodeTypeIDs, focusMode) => {
//     const filteredNodeModularPipelines = [];

//     const nodeItems = cloneDeep(filteredNodeItems);

//     nodeTypeIDs.forEach((nodeTypeId) => {
//       nodeItems[nodeTypeId]?.forEach((filteredNode) => {
//         filteredNode.modularPipelines.forEach((nodeModularPipeline) => {
//           filteredNodeModularPipelines.push(
//             constructModularPipelineItem(
//               modularPipelines.find(
//                 (rawModularPipeline) =>
//                   rawModularPipeline.id === nodeModularPipeline
//               ),
//               focusMode
//             )
//           );
//         });
//       });
//     });

//     return filteredNodeModularPipelines;
//   }
// );

// /**
//  * constructs a modular pipeline item for filtered modular pipeline parents that does not exist in filtered modular pipeline items
//  * @param {obj} modularPipeline the modular pipeine that needs the construction of a modular pipeline item
//  * @return {obj} modular pipeline item
//  */
// const constructModularPipelineItem = (modularPipeline, focusMode) => ({
//   ...modularPipeline,
//   type: 'modularPipeline',
//   icon: 'modularPipeline',
//   visibleIcon: VisibleIcon,
//   invisibleIcon: InvisibleIcon,
//   active: false,
//   selected: false,
//   faded: false,
//   visible: true,
//   disabled: focusMode !== null && focusMode?.id !== modularPipeline.id,
//   checked: modularPipeline.enabled,
// });

// /**
//  * returns the corresponding parent modular pipelines
//  * for all filtered modular pipelines
//  */
// export const getFilteredModularPipelineParent = createSelector(
//   [
//     getFilteredModularPipelineItems,
//     getFilteredNodeModularPipelines,
//     (state) => state.modularPipelines,
//     (state) => state.focusMode,
//   ],
//   (
//     filteredModularPipelines,
//     filteredNodeModularPipelines,
//     modularPipelines,
//     focusMode
//   ) => {
//     const filteredModularPipelineParents = [];
//     const filteredModularPipeline = filteredModularPipelines.modularPipeline;

//     // 1. extract only modular pipelines with additional namespace
//     const childrenModularPipelines = filteredModularPipeline.filter(
//       (modularPipeline) => modularPipeline.id.includes('.')
//     );

//     const checkFilteredModularPipelineList = (modularPipeLineList, parent) =>
//       !modularPipeLineList.some(
//         (modularPipeline) => modularPipeline.id === parent
//       );

//     const checkFilteredNodeModularPipelineList = (
//       filteredNodeModularPipelinesList,
//       parent
//     ) =>
//       !filteredNodeModularPipelinesList.some(
//         (modularPipeline) => modularPipeline.id === parent
//       );

//     // extract the parents only for those modular pipelines that does not have a filtered parent
//     childrenModularPipelines.forEach((childrenModularPipeline) => {
//       const levels = childrenModularPipeline.id.match(/\./g)
//         ? childrenModularPipeline.id.match(/\./g).length
//         : 0;

//       let lastIndex = 0;

//       for (let i = 0; i <= levels - 1; i++) {
//         // obtain the name of that pipeline
//         let parent = childrenModularPipeline.id.substr(
//           0,
//           childrenModularPipeline.id.indexOf('.', lastIndex)
//         );

//         // check against the filtered modular pipeline, existing list of parent pipelines and also the filtered node parent list
//         if (
//           checkFilteredModularPipelineList(filteredModularPipeline, parent) &&
//           !filteredModularPipelineParents.some(
//             (modularPipeline) => modularPipeline.id === parent
//           ) &&
//           checkFilteredNodeModularPipelineList(
//             filteredNodeModularPipelines,
//             parent
//           )
//         ) {
//           // add the relevant modular pipeline to the list of parents
//           filteredModularPipelineParents.push(
//             // construct the item needed and then add it to the list
//             constructModularPipelineItem(
//               modularPipelines.find(
//                 (rawModularPipeline) => rawModularPipeline.id === parent
//               ),
//               focusMode
//             )
//           );
//         }
//         lastIndex = childrenModularPipeline.id.indexOf('.', lastIndex) + 1;
//       }
//     });

//     return filteredModularPipelineParents;
//   }
// );

// /**
//  * returns the corresponding final set of modular pipelines
//  * for constructing the final nested tree list
//  */
// export const getFilteredTreeItems = createSelector(
//   [
//     getFilteredModularPipelineItems,
//     getFilteredNodeModularPipelines,
//     getFilteredModularPipelineParent,
//     (state) => state.modularPipelines,
//   ],
//   (
//     modularPipelineItems,
//     nodeModularPipelines,
//     modularPipelineParent,
//     modularPipelines
//   ) => {
//     modularPipelineItems = modularPipelineItems.modularPipeline;

//     let finalModularPipelines = [];

//     const checkModularPipelineItems = (modularPipelineItems, modularPipeline) =>
//       modularPipelineItems.some(
//         (modularPipelineItem) => modularPipelineItem.id === modularPipeline.id
//       );

//     const checkNodeModularPipelines = (nodeModularPipelines, modularPipeline) =>
//       nodeModularPipelines.some(
//         (nodeModularPipeline) => nodeModularPipeline.id === modularPipeline.id
//       );

//     const checkModularPipelineParentPipeline = (
//       modularPipelineParent,
//       modularPipeline
//     ) =>
//       modularPipelineParent.some(
//         (modularPipelineParentPipeline) =>
//           modularPipelineParentPipeline.id === modularPipeline.id
//       );

//     // sort all 3 sets of modular pipelines according to the original order
//     modularPipelines?.forEach((modularPipeline) => {
//       if (checkModularPipelineItems(modularPipelineItems, modularPipeline)) {
//         finalModularPipelines.push(
//           modularPipelineItems.find(
//             (modularPipelineItem) =>
//               modularPipelineItem.id === modularPipeline.id
//           )
//         );
//       } else if (
//         checkNodeModularPipelines(nodeModularPipelines, modularPipeline)
//       ) {
//         finalModularPipelines.push(
//           nodeModularPipelines.find(
//             (nodeModularPipeline) =>
//               nodeModularPipeline.id === modularPipeline.id
//           )
//         );
//       } else if (
//         checkModularPipelineParentPipeline(
//           modularPipelineParent,
//           modularPipeline
//         )
//       ) {
//         finalModularPipelines.push(
//           modularPipelineParent.find(
//             (modularPipelineParentPipeline) =>
//               modularPipelineParentPipeline.id === modularPipeline.id
//           )
//         );
//       }
//     });

//     return finalModularPipelines;
//   }
// );

// /**
//  * returns an array of the corresponding filtered nodes
//  * & unfiltered nodes for each filtered modular pipeline
//  */
// export const getFilteredModularPipelineNodes = createSelector(
//   [
//     getFilteredNodeItems,
//     getFilteredTreeItems,
//     (state) => state.modularPipelineIds,
//     (state) => state.nodeTypeIDs,
//   ],
//   (filteredNodeItems, filteredTreeItems, modularPipelineIDs, nodeTypeIDs) => {
//     const modularPipelineNodes = arrayToObject(modularPipelineIDs, () => []);

//     const nodeItems = cloneDeep(filteredNodeItems);

//     // assumption: each node is unique and will only exist once on the flowchart, hence we are only taking
//     // the deepest nested modular pipeline as the node's modular pipeline
//     nodeTypeIDs.forEach((nodeTypeId) => {
//       // extract the last modular pipeline within the array of filtered nodes
//       nodeItems[nodeTypeId]?.forEach((node) => {
//         if (node.modularPipelines.length > 1) {
//           node.modularPipelines = node.modularPipelines.slice(-1);
//         }
//       });
//     });

//     // create a new field for the topmost / root pipeline
//     modularPipelineNodes.main = [];

//     // go through each type of nodes according to the order of specified node types in normalize-data
//     // first to identify root level nodes
//     nodeTypeIDs.forEach((nodeTypeId) => {
//       nodeItems[nodeTypeId]?.forEach((node, i) => {
//         if (node.modularPipelines.length === 0) {
//           modularPipelineNodes.main.push(node);
//         }
//       });
//     });

//     // further sort nodes according to status
//     modularPipelineNodes.main.sort(compareEnabledThenType);

//     // go through the set of nodes and slot them into the corresponding modular pipeline array
//     filteredTreeItems.forEach((modularPipeline) => {
//       nodeTypeIDs.forEach((nodeTypeId) => {
//         nodeItems[nodeTypeId]?.forEach((nodeItem) => {
//           if (nodeItem.modularPipelines.includes(modularPipeline.id)) {
//             modularPipelineNodes[modularPipeline.id].push(nodeItem);
//           }
//         });
//       });
//       modularPipelineNodes[modularPipeline.id].sort(compareEnabledThenType);
//     });

//     return modularPipelineNodes;
//   }
// );

// /**
//  * returns an array of modular pipelines arranged in a nested structure with corresponding nodes and names
//  */
// export const getNestedModularPipelines = createSelector(
//   [
//     getFilteredTreeItems,
//     getFilteredModularPipelineNodes,
//     (state) => state.modularPipelines,
//   ],
//   (filteredTreeItems, modularPipelineNodes) => {
//     // go through modular pipeline ids to return nested data structure
//     const mainTree = {
//       nodes: modularPipelineNodes ? modularPipelineNodes.main : [],
//       children: [],
//       name: 'main',
//       id: 'main',
//       enabled: true,
//       type: 'modularpipeline',
//     };
//     let currentParent = mainTree;

//     filteredTreeItems?.forEach((modularPipeline) => {
//       const { id } = modularPipeline;
//       let currentLevel = id.split('.').length;

//       if (currentLevel > 1) {
//         let lastIndex = 0;
//         let parents = [];
//         // obtain all parents for that level
//         for (let i = 0; i <= currentLevel - 1; i++) {
//           // obtain the name of that pipeline
//           parents.push(id.substr(0, id.indexOf('.', lastIndex)));
//           lastIndex = id.indexOf('.', lastIndex) + 1;
//         }

//         // remove any empty instance
//         parents = parents.filter((e) => e);

//         let parent = mainTree;

//         // go through each level to obtain the child
//         parents.forEach((id) => {
//           parent = parent.children.find(
//             (modularPipeline) => modularPipeline.id === id
//           );
//         });

//         currentParent = parent;
//       } else {
//         currentParent = mainTree;
//       }

//       // add in the new level and nodes
//       currentParent.children.push(
//         Object.assign(modularPipeline, {
//           children: [],
//           nodes: modularPipelineNodes[id],
//         })
//       );
//     });

//     return mainTree;
//   }
// );
