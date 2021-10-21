import React, { useState } from 'react';
import classnames from 'classnames';
import CheckIcon from '../../icons/check';
import BookmarkIcon from '../../icons/bookmark';

import './runs-list-card.css';

/**
 * Display a card showing run info from an experiment
 * @param {object} data High-level data from the run (id, timestamp, etc.)
 */
const RunsListCard = ({ data }) => {
  const { runId, timestamp, title = null, bookmark } = data.metaData;
  const [active, setActive] = useState(false);

  return (
    <div
      className={classnames('kedro', 'runs-list-card', {
        'runs-list-card--active': active,
      })}
      onClick={() => setActive(!active)}
    >
      {active && <CheckIcon className={'runs-list-card__checked'} />}
      <div>
        <div className="runs-list-card__title">
          {typeof title === 'string' ? title : timestamp}
        </div>
        <div className="runs-list-card__id">{runId}</div>
        <div className="runs-list-card__timestamp">
          {timestamp.toISOString()}
        </div>
      </div>
      {bookmark && <BookmarkIcon className={'runs-list-card__bookmark'} />}
    </div>
  );
};

export default RunsListCard;
