import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { toHumanReadableTime } from '../../../utils/date-utils';
import CheckIcon from '../../icons/check';
import BookmarkIcon from '../../icons/bookmark';

import './runs-list-card.css';

/**
 * Display a card showing run info from an experiment
 * @param {object} data High-level data from the run (id, timestamp, etc.)
 */
const RunsListCard = ({
  data,
  disableRunSelection = false,
  enableComparisonView = false,
  onRunSelection,
  selectedRuns = [],
}) => {
  const { id, timestamp, title = null, bookmark } = data;
  const [active, setActive] = useState(false);
  const humanReadableTime = toHumanReadableTime(timestamp);

  const onClick = (id) => {
    onRunSelection(id);
  };

  useEffect(() => {
    setActive(selectedRuns.includes(id));
  }, [id, selectedRuns]);

  return (
    <div
      className={classnames('kedro', 'runs-list-card', {
        'runs-list-card--active': active,
        'runs-list-card--disabled': disableRunSelection && !active,
      })}
      onClick={() => onClick(id)}
    >
      {(active || enableComparisonView) && (
        <CheckIcon
          className={classnames('runs-list-card__checked', {
            'runs-list-card__checked--active': active,
            'runs-list-card__checked--comparing': enableComparisonView,
          })}
        />
      )}
      <div>
        <div className="runs-list-card__title">
          {typeof title === 'string' ? title : humanReadableTime}
        </div>
        <div className="runs-list-card__id">{id}</div>
        <div className="runs-list-card__timestamp">{humanReadableTime}</div>
      </div>
      {bookmark && <BookmarkIcon className={'runs-list-card__bookmark'} />}
    </div>
  );
};

export default RunsListCard;
