import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Modal from '../modal';
import FlowChart from '../flowchart';
import Sidebar from '../sidebar';
import MetaData from '../metadata';
import ExportModal from '../export-modal';
import LoadingIcon from '../icons/loading';
import { isLoading } from '../../selectors/loading';
import { chonkyNodeAmount } from '../../config';
import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ loading, theme, nodes, edges }) => {
  // todo: this is the new variable to set up in the state (and stored in localStorage) for remembering user preference for display anyways
  const displayAnyways = false;

  /**
   * Formula to determine if the pipeline is chonky
   */
  const isChunkyNode = (chonkyNodeAmount, nodesNo, edgesNo) => {
    return nodesNo + 1.5 * edgesNo > chonkyNodeAmount ? true : false;
  };

  return (
    <div
      className={classnames('kedro-pipeline', {
        'kui-theme--dark': theme === 'dark',
        'kui-theme--light': theme === 'light'
      })}>
      <h1 className="pipeline-title">Kedro-Viz</h1>
      <Sidebar />
      <MetaData />
      <div className="pipeline-wrapper">
        {isChunkyNode(chonkyNodeAmount, nodes.length, edges.length) === true &&
        displayAnyways === false ? (
          <Modal nodesNo={nodes.length} edgesNo={edges.length} />
        ) : (
          <FlowChart />
        )}
        <LoadingIcon className="pipeline-wrapper__loading" visible={loading} />
      </div>
      <ExportModal />
    </div>
  );
};

// to-do: expose nodes to props
export const mapStateToProps = state => ({
  loading: isLoading(state),
  theme: state.theme,
  nodes: state.graph.nodes || [],
  edges: state.graph.edges || []
});

export default connect(mapStateToProps)(Wrapper);
