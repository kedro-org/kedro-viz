import React from 'react';
import { CSVLink } from 'react-csv';
import { useUpdateRunDetails } from '../../../apollo/mutations';
import IconButton from '../../ui/icon-button';
import PencilIcon from '../../icons/pencil';
import BookmarkIcon from '../../icons/bookmark';
import ExportIcon from '../../icons/export';
import BookmarkStrokeIcon from '../../icons/bookmark-stroke';
import PrimaryToolbar from '../../primary-toolbar';
import ShowChangesIcon from '../../icons/show-changes';
import { constructExportData } from '../../../utils/experiment-tracking-utils';

export const ExperimentPrimaryToolbar = ({
  enableComparisonView,
  enableShowChanges,
  runMetadata,
  runTrackingData,
  selectedRunData,
  setEnableShowChanges,
  setSidebarVisible,
  showChangesIconDisabled,
  showRunDetailsModal,
  sidebarVisible,
}) => {
  const { updateRunDetails } = useUpdateRunDetails();

  const toggleBookmark = () => {
    updateRunDetails({
      runId: selectedRunData.id,
      runInput: { bookmark: !selectedRunData?.bookmark },
    });
  };

  const exportData = constructExportData(runMetadata, runTrackingData);

  return (
    <PrimaryToolbar
      visible={{ sidebar: sidebarVisible }}
      onToggleSidebar={setSidebarVisible}
    >
      <IconButton
        ariaLive="Toggle run bookmark"
        className={'pipeline-menu-button--labels'}
        icon={selectedRunData?.bookmark ? BookmarkIcon : BookmarkStrokeIcon}
        labelText={`${selectedRunData?.bookmark ? 'Unbookmark' : 'Bookmark'}`}
        onClick={() => toggleBookmark()}
        visible={!enableComparisonView}
      />
      <IconButton
        ariaLive="Edit run details"
        className={'pipeline-menu-button--labels'}
        icon={PencilIcon}
        labelText={`Edit details`}
        onClick={() => showRunDetailsModal(true)}
        visible={!enableComparisonView}
      />
      <IconButton
        ariaLive="polite"
        className={'pipeline-menu-button--labels'}
        onClick={() => setEnableShowChanges(!enableShowChanges)}
        icon={ShowChangesIcon}
        labelText={
          !showChangesIconDisabled
            ? `${enableShowChanges ? 'Disable' : 'Enable'} show changes`
            : null
        }
        visible={enableComparisonView}
        disabled={showChangesIconDisabled}
      />
      <CSVLink data={exportData} filename="run-data.csv">
        <IconButton
          ariaLabel="Export graph as SVG or PNG"
          className={'pipeline-menu-button--export'}
          icon={ExportIcon}
          labelText="Export run data"
        />
      </CSVLink>
    </PrimaryToolbar>
  );
};

export default ExperimentPrimaryToolbar;
