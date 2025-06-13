import React from 'react';
import classnames from 'classnames';
import LoadingIcon from './icons/loading';

/**
 * PipelineLoading displays a loading spinner overlay for the pipeline area.
 * @param {Object} props
 * @param {boolean} props.loading - Whether to show the loading spinner.
 * @param {boolean} props.sidebarVisible - Whether the sidebar is visible (affects styling).
 */
const PipelineLoading = ({ loading, sidebarVisible }) => (
  <div
    className={classnames('pipeline-wrapper__loading', {
      'pipeline-wrapper__loading--sidebar-visible': sidebarVisible,
    })}
  >
    <LoadingIcon visible={loading} />
  </div>
);

export default PipelineLoading;
