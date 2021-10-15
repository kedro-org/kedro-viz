import utils from '@quantumblack/kedro-ui/lib/utils';

const { escapeRegExp, getHighlightedText } = utils;
export const getModularPipelineIDs = (state) => state.modularPipeline.ids;
export const getFocusedModularPipeline = (state) =>
  state.visible.modularPipelineFocusMode;
export const getModularPipelineData = (state) => state.modularPipeline.tree;

export const search = (value, searchValue) => {
  if (!value) {
    return false;
  }
  if (searchValue) {
    return new RegExp(escapeRegExp(searchValue), 'gi').test(value);
  }
};

export const getModularPipelinesSearchResult = ({
  modularPipelinesTree,
  searchValue,
}) => {
  if (!modularPipelinesTree) {
    return {};
  }

  const dfs = (modularPipelineID, result) => {
    const modularPipeline = modularPipelinesTree[modularPipelineID];
    if (!modularPipeline) {
      return {};
    }
    const searchResult = {
      ...modularPipeline,
      name: getHighlightedText(modularPipeline.name, searchValue),
      children: [],
    };

    for (const child of modularPipeline.children) {
      if (child.type !== 'modularPipeline') {
        if (search(child.data.name, searchValue)) {
          searchResult.children.push({
            ...child,
            node: {
              ...child.data,
              highlightedLabel: getHighlightedText(
                child.data.name,
                searchValue
              ),
            },
          });
        }
      } else {
        dfs(child.id, result);
        if (
          (result[child.id] && result[child.id].children.length > 0) ||
          search(modularPipeline.name, searchValue)
        ) {
          searchResult.children.push({
            ...child,
            highlightedLabel: getHighlightedText(
              result[child.id]?.name || '',
              searchValue
            ),
          });
        }
      }
    }

    if (
      searchResult.children.length > 0 ||
      search(modularPipeline.name, searchValue)
    ) {
      result[modularPipelineID] = searchResult;
    }
  };
  const result = {};
  dfs('__root__', result);
  return result;
};
