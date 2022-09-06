import React from 'react';
import ContentLoader from 'react-content-loader';
import {
  experimentTrackingLazyLoadingColours,
  experimentTrackingLazyLoadingGap,
} from '../../../config';

import './run-dataset.css';

const GAP = experimentTrackingLazyLoadingGap;

const SubCatLoader = ({ y }) => (
  <>
    <rect width="10" height="10" x="0" y={y + 3} />
    <rect width="100" height="20" x="30" y={y} />
  </>
);

const TitleLoader = ({ y }) => (
  <>
    <rect width="10" height="10" x="0" y={y + 3} />
    <rect width="180" height="20" x="30" y={y} />
    <rect width="50" height="16" x="0" y={y + GAP} />
    <rect width="100" height="16" x="0" y={y + GAP * 2} />
  </>
);

const DetailsLoader = ({ x, y }) => {
  return (
    <>
      <rect width="0" height="0" x={x} y={y} />
      <rect width="50" height="16" x={x} y={y + GAP} />
      <rect width="180" height="16" x={x} y={y + GAP * 2} />
    </>
  );
};

export const SingleRunDatasetLoader = ({ theme }) => (
  <div className="details-dataset">
    <ContentLoader
      viewBox="0 0 1000 625"
      width="1000px"
      height="100%"
      backgroundColor={
        theme === 'dark'
          ? experimentTrackingLazyLoadingColours.backgroundDarkTheme
          : experimentTrackingLazyLoadingColours.backgroundLightTheme
      }
      foregroundColor={
        theme === 'dark'
          ? experimentTrackingLazyLoadingColours.foregroundDarkTheme
          : experimentTrackingLazyLoadingColours.foregroundLightTheme
      }
    >
      <SubCatLoader y={0} />

      <TitleLoader y={35} />
      <DetailsLoader x={380} y={35} />

      <TitleLoader y={160} />
      <DetailsLoader x={380} y={160} />

      <TitleLoader y={300} />
      <DetailsLoader x={380} y={300} />
    </ContentLoader>
  </div>
);

export const DataSetLoader = ({ x, y, length, theme }) => {
  return (
    <ContentLoader
      viewBox="0 10 150 25"
      width="200px"
      height="100%"
      backgroundColor={
        theme === 'dark'
          ? experimentTrackingLazyLoadingColours.backgroundDarkTheme
          : experimentTrackingLazyLoadingColours.backgroundLightTheme
      }
      foregroundColor={
        theme === 'dark'
          ? experimentTrackingLazyLoadingColours.foregroundDarkTheme
          : experimentTrackingLazyLoadingColours.foregroundLightTheme
      }
    >
      <rect width="150" height="16" x={x} y={y + length * 2} />
    </ContentLoader>
  );
};
