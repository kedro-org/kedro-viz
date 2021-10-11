import React, { useState } from 'react';
import classnames from 'classnames';
import BookmarkIcon from '../../icons/bookmark';
import CheckIcon from '../../icons/check';

import './runs-list-card.css';

const RunsListCard = ({ data }) => {
  const { bookmark, id, timestamp, title } = data;
  const [active, setActive] = useState(false);

  return (
    <div
      className={classnames('kedro', 'runs-list-card', {
        'runs-list-card--active': active,
      })}
      onClick={() => setActive(!active)}
    >
      {active ? <CheckIcon className={'runs-list-card__checked'} /> : null}
      <div>
        <div className="runs-list-card__title">
          {typeof title === 'string' ? title : timestamp}
        </div>
        <div className="runs-list-card__id">{id}</div>
        <div className="runs-list-card__timestamp">{timestamp}</div>
      </div>
      {bookmark ? (
        <BookmarkIcon className={'runs-list-card__bookmark'} />
      ) : null}
    </div>
  );
};

export default RunsListCard;
