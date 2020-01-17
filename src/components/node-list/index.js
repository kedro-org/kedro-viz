import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Checkbox from '@quantumblack/kedro-ui/lib/components/checkbox';
import SearchBar from '@quantumblack/kedro-ui/lib/components/search-bar';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { Scrollbars } from 'react-custom-scrollbars';
import { getGroupedNodes } from '../../selectors/nodes';
import { getNodeTypes } from '../../selectors/node-types';
import {
  toggleNodeHovered,
  toggleNodesDisabled,
  toggleTypeActive,
  toggleTypeDisabled
} from '../../actions';
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
    const {
      hasData,
      onToggleNodeHovered,
      onToggleNodesDisabled,
      onToggleTypeActive,
      onToggleTypeDisabled,
      nodes,
      theme,
      types
    } = this.props;
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
          <div className="kedro">
            <h2 className="pipeline-node-list__toggle-title">All Elements</h2>
            <div className="pipeline-node-list__toggle-container">
              <button
                onClick={() => onToggleNodesDisabled(nodeIDs, false)}
                className="pipeline-node-list__toggle">
                <svg
                  className="pipeline-node-list__icon pipeline-node-list__icon--check"
                  width="24"
                  height="24">
                  <polygon points="9.923 14.362 7.385 11.944 6 13.263 7.33384369 14.5336026 9.923 17 18 9.32 16.615 8" />
                </svg>
                Check all
              </button>
              <button
                onClick={() => onToggleNodesDisabled(nodeIDs, true)}
                className="pipeline-node-list__toggle">
                <svg
                  className="pipeline-node-list__icon pipeline-node-list__icon--uncheck"
                  width="24"
                  height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
                Uncheck all
              </button>
            </div>
          </div>
          <ul className="pipeline-node-list">
            {types.map(
              type =>
                formattedNodes[type.id] && (
                  <li key={type.id}>
                    <h3
                      onMouseEnter={() => onToggleTypeActive(type.id, true)}
                      onMouseLeave={() => onToggleTypeActive(type.id, false)}
                      className={classnames('pipeline-node', {
                        'pipeline-node--active': type.active
                      })}>
                      <Checkbox
                        checked={!type.disabled}
                        label={type.name}
                        name={type.name}
                        onChange={(e, { checked }) => {
                          onToggleTypeDisabled(type.id, !checked);
                        }}
                        theme={theme}
                      />
                    </h3>
                    <ul className="pipeline-node-list pipeline-node-list--nest1">
                      {formattedNodes[type.id].map(node => (
                        <li
                          key={node.id}
                          className={classnames(
                            'pipeline-node pipeline-node--nest1',
                            {
                              'pipeline-node--active': node.active,
                              'pipeline-node--disabled':
                                node.disabled_tag ||
                                node.disabled_view ||
                                type.disabled
                            }
                          )}
                          title={node.name}
                          onMouseEnter={() => onToggleNodeHovered(node.id)}
                          onMouseLeave={() => onToggleNodeHovered(null)}>
                          <Checkbox
                            checked={!node.disabled_node}
                            label={
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: node.highlightedLabel
                                }}
                              />
                            }
                            name={node.name}
                            onChange={(e, { checked }) =>
                              onToggleNodesDisabled([node.id], !checked)
                            }
                            theme={theme}
                          />
                        </li>
                      ))}
                    </ul>
                  </li>
                )
            )}
          </ul>
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

export const mapDispatchToProps = dispatch => ({
  onToggleNodeHovered: nodeID => {
    dispatch(toggleNodeHovered(nodeID));
  },
  onToggleNodesDisabled: (nodeIDs, disabled) => {
    dispatch(toggleNodesDisabled(nodeIDs, disabled));
  },
  onToggleTypeActive: (typeID, active) => {
    dispatch(toggleTypeActive(typeID, active));
  },
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NodeList);
