import React, { useCallback, useState } from 'react';
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
  displaySidebar,
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
  const [exportData, setExportData] = useState([]);

  const toggleBookmark = () => {
    updateRunDetails({
      runId: selectedRunData.id,
      runInput: { bookmark: !selectedRunData?.bookmark },
    });
  };

  const updateExportData = useCallback(() => {
    setExportData(constructExportData(runMetadata, runTrackingData));
  }, [runMetadata, runTrackingData]);

  return (
    <PrimaryToolbar
      displaySidebar={displaySidebar}
      onToggleSidebar={setSidebarVisible}
      visible={{ sidebar: sidebarVisible }}
    >
      <IconButton
        active={selectedRunData?.bookmark}
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
        active={enableShowChanges}
        ariaLive="polite"
        className={'pipeline-menu-button--labels'}
        disabled={showChangesIconDisabled}
        icon={ShowChangesIcon}
        labelText={
          !showChangesIconDisabled
            ? `${enableShowChanges ? 'Disable' : 'Enable'} show changes`
            : null
        }
        onClick={() => setEnableShowChanges(!enableShowChanges)}
        visible={enableComparisonView}
      />
      <CSVLink
        asyncOnClick={true}
        data={exportData}
        filename="run-data.csv"
        onClick={updateExportData}
      >
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
