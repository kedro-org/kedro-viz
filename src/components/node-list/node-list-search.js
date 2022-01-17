import React, { useEffect, useRef } from 'react';
import SearchBar from '@quantumblack/kedro-ui/lib/components/search-bar';
import { connect } from 'react-redux';
import { getModularPipelinesTree } from '../../selectors/nodes';
import { getModularPipelinesSearchResult } from '../../selectors/modular-pipelines';
/**
 * Handle Node List Search
 * @param {function} onUpdateSearchValue Event handler
 * @param {string} searchValue Search text
 * @param {string} theme Light/dark theme for Kedro-UI component
 */
export const NodeListSearch = ({
  onUpdateSearchValue,
  searchValue,
  onNodeToggleExpanded,
  theme,
  modularPipelinesTree,
}) => {
  const container = useRef(null);

  /**
   * Focus search on CMD+F/CTRL+F, but only if not already focused, so that if
   * you hit the shortcut again you will receive the default browser behaviour
   * @param {object} event Keydown event
   */
  const handleWindowKeyDown = (event) => {
    const isKeyF = event.key === 'f' || event.keyCode === 70;
    const isKeyCtrlOrCmd = event.ctrlKey || event.metaKey;
    if (isKeyF && isKeyCtrlOrCmd) {
      const input = container.current.querySelector('input');
      if (document.activeElement !== input) {
        input.focus();
        event.preventDefault();
      } else {
        input.blur();
      }
    }
  };

  /**
   * Add window keydown event listener on mount, and remove on unmount
   */
  useEffect(() => {
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  });

  /**
   * Listen for keyboard events, and trigger relevant actions
   * @param {number} keyCode The key event keycode
   */
  const handleKeyDown = (event) => {
    const isKeyEscape = event.key === 'Escape' || event.keyCode === 27;
    if (isKeyEscape) {
      onUpdateSearchValue('');
      container.current.querySelector('input').blur();
    }
  };

  const onSearchChange = (event) => {
    onUpdateSearchValue(event);
    const modularPipelinesSearchResult = event
      ? getModularPipelinesSearchResult(modularPipelinesTree, event)
      : null;
    let modularPipelinesItems = [];
    if (modularPipelinesSearchResult) {
      modularPipelinesItems = Object.keys(modularPipelinesSearchResult);
      modularPipelinesItems = modularPipelinesItems.filter(
        (item) => item !== '__root__'
      );
    }
    console.log(modularPipelinesItems);
    onNodeToggleExpanded(modularPipelinesItems.reverse());
  };

  return (
    <div
      ref={container}
      className="pipeline-nodelist-search"
      onKeyDown={handleKeyDown}
    >
      <SearchBar
        onChange={onSearchChange}
        value={searchValue}
        theme={theme}
        placeholder={'Search'}
      />
    </div>
  );
};

export const mapStateToProps = (state) => ({
  theme: state.theme,
  modularPipelinesTree: getModularPipelinesTree(state),
});

export default connect(mapStateToProps)(NodeListSearch);
