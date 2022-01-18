import React from 'react';
import { useUpdateRunDetails } from '../../../apollo/mutations';
import IconButton from '../../icon-button';
import PencilIcon from '../../icons/pencil';
import BookmarkIcon from '../../icons/bookmark';
import BookmarkStrokeIcon from '../../icons/bookmark-stroke';
import PrimaryToolbar from '../../primary-toolbar';
import ShowChangesIcon from '../../icons/show-changes';

export const ExperimentPrimaryToolbar = ({
  enableComparisonView,
  enableShowChanges,
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
    </PrimaryToolbar>
  );
};

export default ExperimentPrimaryToolbar;
