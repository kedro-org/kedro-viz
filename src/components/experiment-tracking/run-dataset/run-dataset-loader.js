import React from 'react';
import ContentLoader from 'react-content-loader';

import './run-dataset.css';

const GAP = 36;

const TitleLoader = ({ y }) => (
  <>
    <rect width="10" height="10" x="10" y={y + 3} />
    <rect width="180" height="20" x="40" y={y} />
    <rect width="50" height="16" x="0" y={y + GAP} />
    <rect width="100" height="16" x="0" y={y + GAP * 2} />
  </>
);

export const DatasetLoader = ({ x, y }) => {
  return (
    <>
      <rect width="0" height="0" x="350" y={y} />
      <rect width="50" height="16" x="350" y={y + GAP} />
      <rect width="180" height="16" x="350" y={y + GAP * 2} />
    </>
  );
};

export const RunDatasetLoader = () => (
  <div className="details-dataset">
    <ContentLoader
      viewBox="0 0 1000 1000"
      width="1000px"
      height="100%"
      backgroundColor="#ccd1d6"
      foregroundColor="#ecebeb"
      speed={2}
    >
      <TitleLoader y={12} />
      <DatasetLoader x={350} y={12} />

      <TitleLoader y={202} />
      <DatasetLoader x={350} y={202} />

      <TitleLoader y={402} />
      <DatasetLoader x={350} y={402} />
    </ContentLoader>
  </div>
);
