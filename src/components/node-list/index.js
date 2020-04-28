import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { getGroupedNodes } from '../../selectors/nodes';
import getFormattedNodes from './filter-nodes';
import NodeListSearch from './node-list-search';
import NodeListToggleAll from './node-list-toggle';
import NodeListGroups from './node-list-groups';
import './styles/node-list.css';

/**
 * Scrollable list of toggleable nodes, with search & filter functionality
 */
const NodeList = ({ nodes }) => {
  const [searchValue, updateSearchValue] = useState('');
  const { formattedNodes, nodeIDs } = getFormattedNodes(nodes, searchValue);

  return (
    <React.Fragment>
      <NodeListSearch
        onUpdateSearchValue={updateSearchValue}
        searchValue={searchValue}
      />
      <Scrollbars
        className="pipeline-nodelist-scrollbars"
        style={{ width: 'auto' }}
        autoHide
        hideTracksWhenNotNeeded>
        <NodeListToggleAll nodeIDs={nodeIDs} />
        <NodeListGroups nodes={formattedNodes} />
      </Scrollbars>
    </React.Fragment>
  );
};

export const mapStateToProps = state => ({
  nodes: getGroupedNodes(state)
});

export default connect(mapStateToProps)(NodeList);
