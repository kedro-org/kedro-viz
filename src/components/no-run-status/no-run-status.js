import React from 'react';
import { connect } from 'react-redux';

import ExportModal from '../export-modal';
import MetaData from '../metadata';
import MetadataModal from '../metadata-modal';
import Sidebar from '../sidebar';
import SadSmiley from '../icons/sad-smiley';

import './no-run-status.scss';

export const NoRunStatus = ({
  displaySidebar,
  displayMetadataPanel,
  displayExportBtn,
}) => {
  return (
    <div className="kedro-pipeline">
      {displaySidebar && <Sidebar />}
      {displayMetadataPanel && <MetaData />}

      <div className="pipeline-wrapper">
        <div className="pipeline-workflow kedro">
          <div className={'pipeline-no-run-status'}>
            <SadSmiley />
            <h2 className="pipeline-no-run-status__title">
              Kedro run not found
            </h2>
            <p>Please view CLI logs for more details.</p>
          </div>
        </div>
      </div>
      {displayExportBtn && <ExportModal />}
      <MetadataModal />
    </div>
  );
};

export const mapStateToProps = (state) => ({
  displaySidebar: state.display.sidebar,
  sidebarVisible: state.visible.sidebar,
  displayMetadataPanel: state.display.metadataPanel,
  displayExportBtn: state.display.exportBtn,
});

export default connect(mapStateToProps)(NoRunStatus);
