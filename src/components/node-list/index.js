import React from 'react';
import classnames from 'classnames';
import {
  SearchBar,
  Checkbox,
  utils,
} from '@quantumblack/carbon-ui-components';
import './node-list.css';
import { Scrollbars } from 'react-custom-scrollbars';

/**
 * Add a new highlightedLabel field to each of the results
 * @return {object} The results array with a new field added
 */
const highlightMatch = (results, value) => results.map(result => ({
  highlightedLabel: utils.getHighlightedText(
    result.name,
    value
  ),
  ...result
}));

/**
 * Return only the results that match the search text
 * @param {string} value
 */
const filterResults = (results, value) => {
  const valueRegex = value ? new RegExp(utils.escapeRegExp(value), 'gi') : '';
  return results.filter(({ name }) => name.match(valueRegex));
};

class NodeList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchValue: ''
    };
  }

  render() {
    const { nodes, onUpdate, theme } = this.props;
    const { searchValue } = this.state;
    const filteredNodes = filterResults(nodes, searchValue);
    const formattedNodes = highlightMatch(filteredNodes, searchValue);

    return (
      <React.Fragment>
        <div className='pipeline-node-list-search'>
          <SearchBar
            onChange={searchValue => {
              this.setState({ searchValue });
            }}
            value={searchValue} />
        </div>
        <Scrollbars
          className='pipeline-node-list-scrollbars'
          style={{ width: 'auto' }}
          autoHide
          hideTracksWhenNotNeeded>
          <ul className='pipeline-node-list'>
            { formattedNodes.map(node => (
              <li
                key={node.id}
                className={classnames('pipeline-node', {
                  'pipeline-node--active': node.active
                })}
                title={node.name}
                onMouseEnter={() => {
                  onUpdate(node.id, 'active', true);
                }}
                onMouseLeave={() => {
                  onUpdate(node.id, 'active', false);
                }}>
                <Checkbox
                  checked={!node.disabled}
                  label={<span dangerouslySetInnerHTML={{
                    __html: node.highlightedLabel
                  }} />}
                  name={node.name}
                  onChange={(e, { checked }) => {
                    onUpdate(node.id, 'disabled', !checked);
                  }}
                  theme={theme}
                />
              </li>
            ))}
          </ul>
        </Scrollbars>
      </React.Fragment>
    );
  }
}

export default NodeList;