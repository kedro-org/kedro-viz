import React from 'react';
import { connect } from 'react-redux';
import SearchBar from '@quantumblack/kedro-ui/lib/components/search-bar';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { Scrollbars } from 'react-custom-scrollbars';
import { getGroupedNodes } from '../../selectors/nodes';
import NodeListToggleAll from './node-list-toggle';
import NodeListGroups from './node-list-groups';
import './node-list.css';

const { escapeRegExp, getHighlightedText, handleKeyEvent } = utils;

/**
 * Get a list of IDs of the visible nodes
 * @param {object} nodes Grouped nodes
 * @return {array} List of node IDs
 */
export const getNodeIDs = nodes => {
  const getNodeIDs = type => nodes[type].map(node => node.id);
  const concatNodeIDs = (nodeIDs, type) => nodeIDs.concat(getNodeIDs(type));

  return Object.keys(nodes).reduce(concatNodeIDs, []);
};

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
   * Add a new highlightedLabel field to each of the node objects
   * @param {object} nodes Grouped lists of nodes
   * @return {object} The grouped nodes with highlightedLabel fields added
   */
  highlightMatch(nodes) {
    const { searchValue } = this.state;
    const addHighlightedLabel = node => ({
      highlightedLabel: getHighlightedText(node.name, searchValue),
      ...node
    });
    const addLabelsToNodes = (newNodes, type) => ({
      ...newNodes,
      [type]: nodes[type].map(addHighlightedLabel)
    });

    return Object.keys(nodes).reduce(addLabelsToNodes, {});
  }

  /**
   * Check whether a name matches the search text
   * @param {string} name
   * @param {string} searchValue
   * @return {boolean} True if match
   */
  nodeMatchesSearch(node, searchValue) {
    const valueRegex = searchValue
      ? new RegExp(escapeRegExp(searchValue), 'gi')
      : '';
    return Boolean(node.name.match(valueRegex));
  }

  /**
   * Return only the results that match the search text
   * @return {object} Grouped nodes
   */
  filterNodes() {
    const { nodes } = this.props;
    const { searchValue } = this.state;
    const filterNodeLists = (newNodes, type) => ({
      ...newNodes,
      [type]: filterNodesByType(type)
    });
    const filterNodesByType = type =>
      nodes[type].filter(node => this.nodeMatchesSearch(node, searchValue));

    return Object.keys(nodes).reduce(filterNodeLists, {});
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
    const filteredNodes = this.filterNodes();
    const formattedNodes = this.highlightMatch(filteredNodes);
    const nodeIDs = getNodeIDs(filteredNodes);

    return (
      <React.Fragment>
        <div
          className="pipeline-node-list-search"
          onKeyDown={this.handleKeyDown}>
          <SearchBar
            onChange={this.updateSearchValue}
            value={this.state.searchValue}
            theme={this.props.theme}
          />
        </div>
        <Scrollbars
          className="pipeline-node-list-scrollbars"
          style={{ width: 'auto' }}
          autoHide
          hideTracksWhenNotNeeded>
          <NodeListToggleAll nodeIDs={nodeIDs} />
          <NodeListGroups nodes={formattedNodes} />
        </Scrollbars>
      </React.Fragment>
    );
  }
}

export const mapStateToProps = state => ({
  nodes: getGroupedNodes(state),
  theme: state.theme
});

export default connect(mapStateToProps)(NodeList);
