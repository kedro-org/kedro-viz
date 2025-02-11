import React from 'react';
import './orientation.scss';

const LeftRightIcon = ({ className }) => (
  <svg className="icon-orientation horizontal" viewBox="0 0 24 24">
    <path
      className="icon-orientation-arrow__vertical"
      d="M7.84676 17.4288L7.84837 7.84841V4.93823L4.93857 4.93861L4.93696 17.4288L3.05754 15.549L1 17.6066L6.39347 23L11.7869 17.6066L9.7294 15.549L7.84676 17.4288Z"
    />
    <path
      className="icon-orientation-arrow__horizontal"
      d="M23 6.39347L17.6066 1L15.549 3.05754L17.4288 4.93696L4.93857 4.93861L4.93823 7.84837L7.84837 7.84841L17.4288 7.84676L15.549 9.7294L17.6066 11.7869L23 6.39347Z"
    />
  </svg>
);

export default LeftRightIcon;
