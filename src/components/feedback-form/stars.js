import React from 'react';
import IconButton from '../ui/icon-button';
import StarIcon from '../icons/star';

import './stars.scss';

export const Stars = ({
    onClick,
    selectedRating = -1,
    className,
    starsCount = 5,
  }) => {
    return (
      <section className={'stars-wrapper ' + className}>
        {Array.from({ length: starsCount }, (_, index) => (
            <IconButton
             key={index} 
             className={index < selectedRating ? 'active' : ''}
              onClick={() => onClick && onClick(index + 1)}
              icon={StarIcon}
            />
        ))}
      </section>
    );
  };