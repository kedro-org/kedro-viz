import React from 'react';
import './orientation.scss';

const TopBottomIcon = ({ className }) => (
  <svg className="icon-orientation vertical" viewBox="0 0 24 24">
    <path
      className="icon-orientation-arrow__horizontal"
      d="M23 6.39347L17.6066 1L15.549 3.05754L17.4288 4.93696L4.93861 4.93857L4.93823 7.84837H7.84841L17.4288 7.84676L15.549 9.7294L17.6066 11.7869L23 6.39347Z"
    />
    <path
      className="icon-orientation-arrow__vertical"
      d="M7.84676 17.4288L7.84841 7.84837L7.84837 4.93823L4.93861 4.93857L4.93696 17.4288L3.05754 15.549L1 17.6066L6.39347 23L11.7869 17.6066L9.7294 15.549L7.84676 17.4288Z"
    />
  </svg>
);

export default TopBottomIcon;
