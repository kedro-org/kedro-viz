import React from 'react';
import { useUpdateRunDetails } from '../../../apollo/mutations';
import IconButton from '../../ui/icon-button';
import PencilIcon from '../../icons/pencil';
import BookmarkIcon from '../../icons/bookmark';
import ExportIcon from '../../icons/export';
import BookmarkStrokeIcon from '../../icons/bookmark-stroke';
import PrimaryToolbar from '../../primary-toolbar';
import ShowChangesIcon from '../../icons/show-changes';
import { Transition } from 'react-transition-group';

const duration = 300;

const defaultStyle = {
  transition: `transform ${duration}ms ease-in-out`,
};

const transitionLeftToRight = {
  entering: {
    opacity: 0.5,
    transform: 'translateX(50%)',
    visibility: 'visible',
  },
  entered: {
    opacity: 1,
    transform: 'translateX(50%)',
    visibility: 'visible',
  },
  exiting: {
    transform: 'translateX(-50%)',
    opacity: 0.5,
    visibility: 'hidden',
  },
  exited: {
    transform: 'translateX(-50%)',
    opacity: 0,
    visibility: 'hidden',
  },
};

const transitionRightToLeft = {
  entering: {
    opacity: 0.5,
    transform: 'translateX(-50%)',
    visibility: 'visible',
  },
  entered: {
    opacity: 1,
    transform: 'translateX(-50%)',
    visibility: 'visible',
  },
  exiting: {
    transform: 'translateX(50%)',
    opacity: 0.5,
    visibility: 'hidden',
  },
  exited: {
    transform: 'translateX(50%)',
    opacity: 0,
    visibility: 'hidden',
  },
};

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
      <div
        className="pipeline-menu-button--wrapper"
        style={{ display: 'flex' }}
      >
        <Transition in={enableComparisonView} timeout={duration}>
          {(state) => (
            <div
              style={{
                ...defaultStyle,
                ...transitionLeftToRight[state],
              }}
            >
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
            </div>
          )}
        </Transition>
        <Transition in={!enableComparisonView} timeout={duration}>
          {(state) => (
            <div
              style={{
                ...defaultStyle,
                ...transitionRightToLeft[state],
              }}
            >
              <IconButton
                active={selectedRunData?.bookmark}
                ariaLabel="Toggle run bookmark"
                className={'pipeline-menu-button--labels'}
                icon={
                  selectedRunData?.bookmark ? BookmarkIcon : BookmarkStrokeIcon
                }
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
            </div>
          )}
        </Transition>
      </div>
    </PrimaryToolbar>
  );
};

export default ExperimentPrimaryToolbar;
