import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { isLoading } from '../../selectors/loading';
import ExportModal from '../export-modal';
import Workflow from './workflow';
import LoadingIcon from '../icons/loading';
import MetaData from '../metadata';
import MetadataModal from '../metadata-modal';
import Sidebar from '../sidebar';

/**
 * Main flowchart container. Handles showing/hiding the sidebar nav for flowchart view,
 * the rendering of the flowchart, as well as the display of all related modals.
 */
export const WorkflowWrapper = ({
  displaySidebar,
  loading,
  sidebarVisible,
  displayMetadataPanel,
  displayExportBtn,
}) => {
  return (
    <div className="kedro-pipeline">
      {displaySidebar && <Sidebar />}
      {displayMetadataPanel && <MetaData />}

      <div className="pipeline-wrapper">
        <Workflow />
        <div
          className={classnames('pipeline-wrapper__loading', {
            'pipeline-wrapper__loading--sidebar-visible': sidebarVisible,
          })}
        >
          <LoadingIcon visible={loading} />
        </div>
      </div>
      {displayExportBtn && <ExportModal />}
      <MetadataModal />
    </div>
  );
};

export const mapStateToProps = (state) => ({
  displaySidebar: state.display.sidebar,
  loading: isLoading(state),
  sidebarVisible: state.visible.sidebar,
  displayMetadataPanel: state.display.metadataPanel,
  displayExportBtn: state.display.exportBtn,
});

export const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(WorkflowWrapper);
