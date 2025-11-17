import React from 'react';
import { connect } from 'react-redux';

import Sidebar from '../sidebar';
import { PipelineWarningContent } from '../pipeline-warning/pipeline-warning';

export const RunNotFoundWarning = ({ displaySidebar, sidebarVisible }) => {
  return (
    <div className="kedro-pipeline">
      {displaySidebar && <Sidebar />}
      <PipelineWarningContent
        isVisible={true}
        title="Kedro run not found"
        subtitle="Please view CLI logs for more details."
        sidebarVisible={sidebarVisible}
      />
    </div>
  );
};

export const mapStateToProps = (state) => ({
  displaySidebar: state.display.sidebar,
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(RunNotFoundWarning);
