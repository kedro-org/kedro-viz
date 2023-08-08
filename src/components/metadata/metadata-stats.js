import React from 'react';
import { formatFileSize, formatNumberWithCommas } from '../../utils';
import './styles/metadata-stats.css';

const MetaDataStats = ({ stats }) => (
  <ul>
    {Object.keys(stats).map((statsKey) => (
      <React.Fragment key={statsKey}>
        <li
          className="pipeline-metadata__value pipeline-metadata-value__stats"
          data-test={`stats-value-${statsKey}`}
        >
          {statsKey !== 'file_size'
            ? formatNumberWithCommas(stats[statsKey])
            : formatFileSize(stats[statsKey])}
        </li>
        <span
          className="pipeline-metadata__label pipeline-metadata-label__stats"
          data-test={`stats-label-${statsKey}`}
        >
          {statsKey && statsKey.replace(/_/g, ' ')}
        </span>
      </React.Fragment>
    ))}
  </ul>
);

export default MetaDataStats;
