import utils from '@quantumblack/kedro-ui/lib/utils';
const { escapeRegExp, getHighlightedText } = utils;

export const getModularPipelineIDs = (state) => state.modularPipeline.ids;
export const getModularPipelinesTree = (state) => state.modularPipeline.tree;
export const getFocusedModularPipeline = (state) =>
  state.visible.modularPipelineFocusMode;
// const getPrettyName = (state) => state.prettyName;

export const modularPipelineMatchesSearch = (modularPipeline, searchValue) => {
  if (searchValue) {
    return new RegExp(escapeRegExp(searchValue), 'gi').test(
      modularPipeline.name
    );
  }

  return true;
};

export const getFilteredModularPipelinesTree = ({
  modularPipelinesTree,
  searchValue,
}) => {
  return Object.entries(modularPipelinesTree).reduce(
    (tree, [modularPipelineID, modularPipeline]) => {
      if (modularPipelineID === '__root__') {
        return tree;
      }

      if (modularPipelineMatchesSearch(modularPipeline, searchValue)) {
        tree[modularPipelineID] = {
          ...modularPipeline,
          highlightedLabel: getHighlightedText(
            modularPipeline.name,
            searchValue
          ),
        };
        tree['__root__'].children.push({
          id: modularPipelineID,
          type: 'modularPipeline',
        });
      }
      return tree;
    },
    { __root__: { id: '__root__', name: 'Root', children: [] } }
  );
};
