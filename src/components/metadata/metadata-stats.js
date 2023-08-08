import React from 'react';
import { formatFileSize, formatNumberWithCommas } from '../../utils';
import { datasetStatLabels } from '../../config';
import './styles/metadata-stats.css';

const MetaDataStats = ({ stats }) => (
  <ul>
    {datasetStatLabels.map((statLabel) => (
      <React.Fragment key={statLabel}>
        <li
          className="pipeline-metadata__value pipeline-metadata-value__stats"
          data-test={`stats-value-${statLabel}`}
        >
          {stats.hasOwnProperty(statLabel)
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

export default MetaDataStats;
