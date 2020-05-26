import React from 'react';
import SearchBar from '@quantumblack/kedro-ui/lib/components/search-bar';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { connect } from 'react-redux';

/**
 * Handle Node List Search
 * @param {function} onUpdateSearchValue Event handler
 * @param {string} searchValue Search text
 * @param {string} theme Light/dark theme for Kedro-UI component
 */
export const NodeListSearch = ({ onUpdateSearchValue, searchValue, theme }) => {
  /**
   * Listen for keyboard events, and trigger relevant actions
   * @param {number} keyCode The key event keycode
   */
  const handleKeyDown = event => {
    utils.handleKeyEvent(event.keyCode, {
      escape: onUpdateSearchValue.bind(this, '')
    });
  };

  return (
    <div className="pipeline-nodelist-search" onKeyDown={handleKeyDown}>
      <SearchBar
        onChange={onUpdateSearchValue}
        value={searchValue}
        theme={theme}
      />
    </div>
  );
};

export const mapStateToProps = state => ({
  theme: state.theme
});

export default connect(mapStateToProps)(NodeListSearch);
