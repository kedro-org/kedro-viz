import React from 'react';
import { useUpdateRunDetails } from '../../../apollo/mutations';
import IconButton from '../../ui/icon-button';
import PencilIcon from '../../icons/pencil';
import BookmarkIcon from '../../icons/bookmark';
import ExportIcon from '../../icons/export';
import BookmarkStrokeIcon from '../../icons/bookmark-stroke';
import PrimaryToolbar from '../../primary-toolbar';
import ShowChangesIcon from '../../icons/show-changes';

import { SlidingLeftToRight, SlindingRightToLeft } from './sliding-animation';

import './experiment-primary-toolbar.css';

const duration = 300;

export const ExperimentPrimaryToolbar = ({
  displaySidebar,
  enableComparisonView,
  enableShowChanges,
  selectedRunData,
  setEnableShowChanges,
  setSidebarVisible,
  showChangesIconDisabled,
  showRunDetailsModal,
  sidebarVisible,
  setShowRunExportModal,
}) => {
  const { updateRunDetails } = useUpdateRunDetails();

  const toggleBookmark = () => {
    updateRunDetails({
      runId: selectedRunData.id,
      runInput: { bookmark: !selectedRunData?.bookmark },
    });
  };

  return (
    <PrimaryToolbar
      displaySidebar={displaySidebar}
      onToggleSidebar={setSidebarVisible}
      visible={{ sidebar: sidebarVisible }}
    >
      <div className="pipeline-menu-button--wrapper">
        <SlidingLeftToRight state={enableComparisonView} duration={duration}>
          <IconButton
            active={enableShowChanges}
            ariaLabel="Toggle show changes"
            className={'pipeline-menu-button--labels'}
            disabled={showChangesIconDisabled}
            icon={ShowChangesIcon}
            labelText={
              !showChangesIconDisabled
                ? `${enableShowChanges ? 'Disable' : 'Enable'} show changes`
                : null
            }
            onClick={() => setEnableShowChanges(!enableShowChanges)}
          />
          <IconButton
            ariaLabel="Export Run Data"
            className={'pipeline-menu-button--export-runs'}
            icon={ExportIcon}
            labelText="Export run data"
            onClick={() => setShowRunExportModal(true)}
          />
        </SlidingLeftToRight>
        <SlindingRightToLeft state={!enableComparisonView} duration={duration}>
          <IconButton
            active={selectedRunData?.bookmark}
            ariaLabel="Toggle run bookmark"
            className={'pipeline-menu-button--labels'}
            icon={selectedRunData?.bookmark ? BookmarkIcon : BookmarkStrokeIcon}
            labelText={`${
              selectedRunData?.bookmark ? 'Unbookmark' : 'Bookmark'
            }`}
            onClick={() => toggleBookmark()}
          />
          <IconButton
            ariaLabel="Edit run details"
            className={'pipeline-menu-button--labels'}
            icon={PencilIcon}
            labelText={`Edit details`}
            onClick={() => showRunDetailsModal(true)}
          />
          <IconButton
            ariaLabel="Export Run Data"
            className={'pipeline-menu-button--export-runs'}
            icon={ExportIcon}
            labelText="Export run data"
            onClick={() => setShowRunExportModal(true)}
          />
        </SlindingRightToLeft>
      </div>
    </PrimaryToolbar>
  );
};

export default ExperimentPrimaryToolbar;
