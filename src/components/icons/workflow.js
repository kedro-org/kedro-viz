import React from 'react';

const WorkflowIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <mask
      id="mask0_3908_33753"
      style={{ maskType: 'alpha' }}
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="24"
      height="24"
    >
      <rect
        width="24"
        height="24"
        transform="matrix(-1 0 0 1 24 0)"
        fill="#D9D9D9"
      />
    </mask>
    <g mask="url(#mask0_3908_33753)">
      <path d="M22.4807 12.7497V11.2498H17.0115L14.7884 17.0228L9.21149 2.80371L5.91536 11.2498H1.49996V12.7497H6.96921L9.21151 6.96709L14.798 21.1862L18.0653 12.7497H22.4807Z" />
    </g>
  </svg>
);

export default WorkflowIcon;
