import React, { useState, useRef, useLayoutEffect } from 'react';
import { formatFileSize, formatNumberWithCommas } from '../../utils';
import { datasetStatLabels, statsRowLen } from '../../config';
import './styles/metadata-stats.css';

const MetaDataStats = ({ stats }) => {
  const [hasOverflow, setHasOverflow] = useState(false);
  const statsContainerRef = useRef(null);

  useLayoutEffect(() => {
    const statsContainer = statsContainerRef.current;

    if (!statsContainer) {
      return;
    }

    const statsLen = Array.from(statsContainer.children).reduce(
      (total, item) => total + item.outerText?.length,
      0
    );

    setHasOverflow(statsLen > statsRowLen);
  }, [stats]);

  return (
    <ul
      ref={statsContainerRef}
      className={`stats-container__${hasOverflow ? 'overflow' : 'no-overflow'}`}
    >
      {datasetStatLabels.map((statLabel) => (
        <React.Fragment key={statLabel}>
          <li
            className="pipeline-metadata__value pipeline-metadata-value__stats"
            data-test={`stats-value-${statLabel}`}
          >
            {stats?.hasOwnProperty(statLabel)
              ? statLabel !== 'file_size'
                ? formatNumberWithCommas(stats[statLabel])
                : formatFileSize(stats[statLabel])
              : 'N/A'}
          </li>
          <span
            className="pipeline-metadata__label pipeline-metadata-label__stats"
            data-test={`stats-label-${statLabel}`}
          >
            {statLabel && statLabel.replace(/_/g, ' ')}
          </span>
        </React.Fragment>
      ))}
    </ul>
  );
};

export default MetaDataStats;
