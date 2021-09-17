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
