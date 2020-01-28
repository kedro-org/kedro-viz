import React from 'react';
import { connect } from 'react-redux';
import SearchBar from '@quantumblack/kedro-ui/lib/components/search-bar';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { Scrollbars } from 'react-custom-scrollbars';
import { getGroupedNodes } from '../../selectors/nodes';
import { getNodeTypes } from '../../selectors/node-types';
import NodeListToggleAll from './node-list-toggle';
import NodeListGroups from './node-list-groups';
import './node-list.css';

const { escapeRegExp, getHighlightedText, handleKeyEvent } = utils;

/**
 * Scrollable list of toggleable nodes, with search & filter functionality
 */
class NodeList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchValue: ''
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.updateSearchValue = this.updateSearchValue.bind(this);
  }

  /**
   * Add a new highlightedLabel field to each of the results
   * @param {object} results
   * @return {object} The results array with a new field added
   */
  highlightMatch(results) {
    const obj = {};
    Object.keys(results).forEach(key => {
      obj[key] = results[key].map(result => ({
        highlightedLabel: getHighlightedText(
          result.name,
          this.state.searchValue
        ),
        ...result
      }));
    });
    return obj;
  }

  /**
   * Check whether a name matches the search text
   * @param {string} name
   * @param {string} searchValue
   */
  nodeMatchesSearch(node, searchValue) {
    const valueRegex = searchValue
      ? new RegExp(escapeRegExp(searchValue), 'gi')
      : '';
    return node.name.match(valueRegex);
  }

  /**
   * Return only the results that match the search text
   * @param {object} nodes
   */
  filterResults(nodes) {
    const obj = {};
    Object.keys(nodes).forEach(key => {
      obj[key] = nodes[key].filter(node =>
        this.nodeMatchesSearch(node, this.state.searchValue)
      );
    });
    return obj;
  }

  /**
   * Get a list of IDs of the visible nodes
   * @param {object} filteredNodes
   */
  getNodeIDs(filteredNodes) {
    return Object.keys(filteredNodes).reduce(
      (nodeIDs, key) => nodeIDs.concat(filteredNodes[key].map(node => node.id)),
      []
    );
  }

  /**
   * Listen for keyboard events, and trigger relevant actions
   * @param {number} keyCode The key event keycode
   */
  handleKeyDown(event) {
    handleKeyEvent(event.keyCode, {
      escape: this.updateSearchValue.bind(this, '')
    });
  }

  /**
   * Apply the new search filter text to the component state
   * @param {string} searchValue The term being searched
   */
  updateSearchValue(searchValue) {
    this.setState({
      searchValue
    });
  }

  render() {
    const { hasData, nodes, theme, types } = this.props;
    const { searchValue } = this.state;
    if (!hasData) {
      return null;
    }
    const filteredNodes = this.filterResults(nodes);
    const formattedNodes = this.highlightMatch(filteredNodes);
    const nodeIDs = this.getNodeIDs(filteredNodes);

    return (
      <React.Fragment>
        <div
          className="pipeline-node-list-search"
          onKeyDown={this.handleKeyDown}>
          <SearchBar
            onChange={this.updateSearchValue}
            value={searchValue}
            theme={theme}
          />
        </div>
        <Scrollbars
          className="pipeline-node-list-scrollbars"
          style={{ width: 'auto' }}
          autoHide
          hideTracksWhenNotNeeded>
          <NodeListToggleAll nodeIDs={nodeIDs} />
          <NodeListGroups nodes={formattedNodes} types={types} />
        </Scrollbars>
      </React.Fragment>
    );
  }
}

export const mapStateToProps = state => ({
  hasData: Boolean(state.nodes.length),
  nodes: getGroupedNodes(state),
  theme: state.theme,
  types: getNodeTypes(state)
});

export default connect(mapStateToProps)(NodeList);
