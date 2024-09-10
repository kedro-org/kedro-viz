import React from 'react';
import IconButton from '../ui/icon-button';
import StarIcon from '../icons/star';

import './stars.scss';

export const Stars = ({ onClick, selectedRating = -1, starsCount = 5 }) => {
  return (
    <section className="stars-wrapper">
      {Array.from({ length: starsCount }, (_, index) => (
        <IconButton
          icon={StarIcon}
          onClick={() => onClick && onClick(index + 1)}
          className={index < selectedRating ? 'active' : ''}
          key={index}
        />
      ))}
    </section>
  );
};
