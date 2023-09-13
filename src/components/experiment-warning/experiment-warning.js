import React from 'react';

import './experiment-warning.scss';

const ExperimentWarning = ({ title, subTitle }) => (
  <div className="experiment-warning__wrapper">
    <h2 className="experiment-warning__title">{title}</h2>
    <p className="experiment-warning__subtitle">{subTitle}</p>
  </div>
);

export default ExperimentWarning;
