import React from 'react';
import ContentLoader from 'react-content-loader';

import './run-metadata.css';

const TitleLoader = () => (
  <>
    <rect width="180" height="20" x="0" y="12" />
    <rect width="88" height="16" x="0" y="58" />
    <rect width="88" height="16" x="0" y="94" />
    <rect width="88" height="16" x="0" y="130" />
    <rect width="88" height="16" x="0" y="166" />
    <rect width="88" height="16" x="0" y="202" />
  </>
);

export const MetadataLoader = ({ x }) => (
  <>
    <rect width="0" height="0" x={x} y="12" />
    <rect width="30" height="16" x={x} y="58" />
    <rect width="180" height="16" x={x} y="94" />
    <rect width="88" height="16" x={x} y="130" />
    <rect width="50" height="16" x={x} y="166" />
    <rect width="100" height="16" x={x} y="202" />
  </>
);

export const RunMetadataLoader = () => (
  <div className="details-metadata">
    <ContentLoader
      viewBox="0 0 1000 300"
      width="1000px"
      height="100%"
      backgroundColor="#ccd1d6"
      foregroundColor="#ecebeb"
      speed={2}
    >
      <TitleLoader />
      <MetadataLoader x={350} />
    </ContentLoader>
  </div>
);
