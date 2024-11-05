import React, { useState } from 'react';
import debounce from 'lodash/debounce';
import NodeList from './node-list';
import { getModularPipelinesSearchResult } from '../../selectors/modular-pipelines';

import { AppContextProvider } from './utils/app-context';

import './styles/node-list.scss';

/**
 * Provides data from the store to populate a NodeList component.
 * Also handles user interaction and dispatches updates back to the store.
 */
const NodeListProvider = ({ faded, modularPipelinesTree }) => {
  const [searchValue, updateSearchValue] = useState('');

  const modularPipelinesSearchResult = searchValue
    ? getModularPipelinesSearchResult(modularPipelinesTree, searchValue)
    : null;

  return (
    <AppContextProvider>
      <NodeList
        faded={faded}
        modularPipelinesTree={modularPipelinesTree}
        modularPipelinesSearchResult={modularPipelinesSearchResult}
        searchValue={searchValue}
        onUpdateSearchValue={debounce(updateSearchValue, 250)}
      />
    </AppContextProvider>
  );
};

export default NodeListProvider;
