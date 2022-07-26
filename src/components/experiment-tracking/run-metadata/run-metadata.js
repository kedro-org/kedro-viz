import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import { useOutsideClick } from '../../../utils/hooks';
import { useUpdateRunDetails } from '../../../apollo/mutations';
import { toHumanReadableTime } from '../../../utils/date-utils';
import CloseIcon from '../../icons/close';
import IconButton from '../../ui/icon-button';
import KebabIcon from '../../icons/kebab';
import SelectedPin from '../../icons/selected-pin';
import UnSelectedPin from '../../icons/un-selected-pin';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import './run-metadata.css';
import './animation.css';

// Return a '-' character if the value is empty or null
const sanitiseEmptyValue = (value) => {
  return value === '' || value === null ? '-' : value;
};

const HiddenMenu = ({ isBookmarked, runId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { updateRunDetails } = useUpdateRunDetails();

  const handleClickOutside = useCallback(() => {
    setIsVisible(false);
  }, []);

  const menuRef = useOutsideClick(handleClickOutside);

  const toggleBookmark = () => {
    updateRunDetails({
      runId,
      runInput: { bookmark: !isBookmarked },
    });

    // Close the menu when the bookmark is toggled.
    setIsVisible(false);
  };

  return (
    <div
      className="hidden-menu-wrapper"
      onClick={() => setIsVisible(!isVisible)}
      ref={menuRef}
    >
      <div
        className={classnames('hidden-menu', {
          'hidden-menu--visible': isVisible,
        })}
      >
        <div
          className="hidden-menu__item"
          onClick={(e) => {
            toggleBookmark();
            e.stopPropagation();
          }}
        >
          {isBookmarked ? 'Unbookmark' : 'Bookmark'}
        </div>
      </div>
      <IconButton
        active={isVisible}
        ariaLabel="Runs menu"
        className="pipeline-menu-button--labels"
        icon={KebabIcon}
      />
    </div>
  );
};

export const MetadataTitle = ({
  className,
  enableShowChanges,
  isSingleRun,
  onRunSelection,
  onTitleOrNoteClick,
  pinnedRun,
  run,
  setPinnedRun,
}) => {
  return (
    <td className={className}>
      <span
        className="details-metadata__title-detail"
        onClick={() => onTitleOrNoteClick(run.id)}
        title={sanitiseEmptyValue(run.title)}
      >
        {sanitiseEmptyValue(run.title)}
      </span>
      {isSingleRun ? (
        <ul className="details-metadata__buttons">
          <HiddenMenu isBookmarked={run.bookmark} runId={run.id} />
        </ul>
      ) : (
        <ul className="details-metadata__buttons">
          <IconButton
            active={run.id === pinnedRun}
            ariaLive="polite"
            className={classnames(
              'pipeline-menu-button--labels',
              'pipeline-menu-button__pin',
              {
                'details-metadata__buttons--selected-pin': run.id === pinnedRun,
              }
            )}
            icon={run.id === pinnedRun ? SelectedPin : UnSelectedPin}
            labelText={run.id === pinnedRun ? 'Baseline' : 'Make baseline'}
            labelTextPosition="bottom"
            onClick={() => setPinnedRun(run.id)}
            visible={enableShowChanges}
          />
          <HiddenMenu isBookmarked={run.bookmark} runId={run.id} />
          <IconButton
            ariaLive="polite"
            className="pipeline-menu-button--labels__close"
            icon={CloseIcon}
            labelText="Remove run"
            labelTextPosition="bottom"
            onClick={() => onRunSelection(run.id)}
          />
        </ul>
      )}
    </td>
  );
};

const RunMetadata = ({
  enableComparisonView,
  enableShowChanges = false,
  isSingleRun,
  onRunSelection,
  pinnedRun,
  runs = [],
  setPinnedRun,
  setRunMetadataToEdit,
  setShowRunDetailsModal,
}) => {
  let initialState = {};
  for (let i = 0; i < runs.length; i++) {
    initialState[i] = false;
  }

  const [toggleNotes, setToggleNotes] = useState(initialState);

  const onToggleNoteExpand = (index) => {
    setToggleNotes({ ...toggleNotes, [index]: !toggleNotes[index] });
  };

  const onTitleOrNoteClick = (id) => {
    const metadata = runs.find((run) => run.id === id);

    setRunMetadataToEdit(metadata);
    setShowRunDetailsModal(true);
  };

  return (
    <TransitionGroup component="div" className="details-metadata">
      {runs.map((run, i) => {
        const humanReadableTime = toHumanReadableTime(run.id);

        return (
          <CSSTransition
            key={run.id}
            timeout={300}
            classNames="details-metadata__run-animation"
          >
            <div
              className={classnames('details-metadata__run', {
                'details-metadata__run--baseline-comparision-view':
                  i === 0 && enableComparisonView,
                'details-metadata__run--other': i > 0,
              })}
              key={run.id}
            >
              <table className="details-metadata__table">
                <tbody>
                  <tr>
                    {i === 0 ? (
                      <MetadataTitle
                        className={classnames(
                          'details-metadata__title',
                          'details-metadata__title--empty',
                          {
                            'details-metadata__title--empty-comparision-mode':
                              enableComparisonView,
                          }
                        )}
                        enableShowChanges={enableShowChanges}
                        isSingleRun={isSingleRun}
                        onRunSelection={onRunSelection}
                        onTitleOrNoteClick={onTitleOrNoteClick}
                        pinnedRun={pinnedRun}
                        run={run}
                        setPinnedRun={setPinnedRun}
                      />
                    ) : null}
                    <MetadataTitle
                      className={classnames('details-metadata__title', {
                        'details-metadata__title-baseline': i === 0,
                        'details-metadata__title--baseline-comparision-mode':
                          i === 0 && enableComparisonView,
                      })}
                      enableShowChanges={enableShowChanges}
                      isSingleRun={isSingleRun}
                      onRunSelection={onRunSelection}
                      onTitleOrNoteClick={onTitleOrNoteClick}
                      pinnedRun={pinnedRun}
                      run={run}
                      setPinnedRun={setPinnedRun}
                    />
                  </tr>
                  <tr>
                    {i === 0 ? (
                      <td className="details-metadata__table-label">
                        Created By
                      </td>
                    ) : null}
                    <td className="details-metadata__table-value">
                      {sanitiseEmptyValue(run.author)}
                    </td>
                  </tr>
                  <tr>
                    {i === 0 ? (
                      <td className="details-metadata__table-label">
                        Creation Date
                      </td>
                    ) : null}
                    <td className="details-metadata__table-value">{`${humanReadableTime} (${sanitiseEmptyValue(
                      run.id
                    )})`}</td>
                  </tr>
                  <tr>
                    {i === 0 ? (
                      <td className="details-metadata__table-label">Git SHA</td>
                    ) : null}
                    <td className="details-metadata__table-value">
                      {sanitiseEmptyValue(run.gitSha)}
                    </td>
                  </tr>
                  <tr>
                    {i === 0 ? (
                      <td className="details-metadata__table-label">
                        Git Branch
                      </td>
                    ) : null}
                    <td className="details-metadata__table-value">
                      {sanitiseEmptyValue(run.gitBranch)}
                    </td>
                  </tr>
                  <tr>
                    {i === 0 ? (
                      <td className="details-metadata__table-label">
                        Run Command
                      </td>
                    ) : null}
                    <td className="details-metadata__table-value">
                      {sanitiseEmptyValue(run.runCommand)}
                    </td>
                  </tr>
                  <tr>
                    {i === 0 ? (
                      <td className="details-metadata__table-label">Notes</td>
                    ) : null}
                    <td className="details-metadata__table-value">
                      <p
                        className={classnames(
                          'details-metadata__notes',
                          'details-metadata__table-label'
                        )}
                        onClick={() => onTitleOrNoteClick(run.id)}
                        style={toggleNotes[i] ? { display: 'block' } : null}
                      >
                        {run.notes !== '' ? run.notes : '- Add notes here'}
                      </p>
                      {run.notes.length > 100 ? (
                        <button
                          className="details-metadata__show-more kedro"
                          onClick={() => onToggleNoteExpand(i)}
                        >
                          {toggleNotes[i] ? 'Show less' : 'Show more'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CSSTransition>
        );
      })}
    </TransitionGroup>
  );
};

export default RunMetadata;
