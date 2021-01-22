import React from 'react';

export default ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24">
    {/* Note: some strokeWidth values fail when zoomed in Chrome e.g. 2 */}
    <rect x="8.5" y="9" width="5" height="5" rx="1" strokeWidth="1.9" />
  </svg>
);
