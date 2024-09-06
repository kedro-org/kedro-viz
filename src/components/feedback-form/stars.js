import React, { useEffect, useState } from 'react';
import range from 'lodash/range';
import IconButton from '../ui/icon-button';
import StarIcon from '../icons/star';
import { List } from './list';

import './stars.scss';

export const Stars = ({
  onClick,
  selectedRating = -1,
  name,
  className,
  size = 24,
  isActive = true,
  starsCount = 5,
}) => {
  return (
    <ul className={'stars-wrapper'} data-element-name={name}>
      <List
        data={range(1, starsCount + 1).reverse()}
        render={({ item, index }) => (
          <IconButton
            key={index}
            aria-disabled={!isActive}
            onClick={() => isActive && onClick && onClick(item)}
            icon={StarIcon}
          />
        )}
      />
    </ul>
  );
};
