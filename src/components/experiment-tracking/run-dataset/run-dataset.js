import React from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';
import PinArrowIcon from '../../icons/pin-arrow';
import { sanitizeValue } from '../../../utils/experiment-tracking-utils';
import {
  TransitionGroup,
  CSSTransition,
  SwitchTransition,
} from 'react-transition-group';

import './run-dataset.css';
import '../run-metadata/animation.css';

const determinePinIcon = (data, pinValue, pinnedRun) => {
  if (data.runId !== pinnedRun && typeof data.value === 'number') {
    if (data.value > pinValue) {
      return 'upArrow';
    }
    if (data.value < pinValue) {
      return 'downArrow';
    }
  }
  return null;
};

const resolveRunDataWithPin = (runData, pinnedRun) => {
  const pinValue = runData.filter((data) => data.runId === pinnedRun)[0]?.value;

  if (typeof pinValue === 'number') {
    return runData.map((data) => ({
      pinIcon: determinePinIcon(data, pinValue, pinnedRun),
      ...data,
    }));
  }

  return runData;
};

/**
 * Display the dataset of the experiment tracking run.
 * @param {boolean} props.enableShowChanges Are changes enabled or not.
 * @param {boolean} props.isSingleRun Indication to display a single run.
 * @param {string} props.pinnedRun ID of the pinned run.
 * @param {array} props.selectedRunIds Array of strings of runIds.
 * @param {array} props.trackingData The experiment tracking run data.
 */
const RunDataset = ({
  enableComparisonView,
  enableShowChanges,
  isSingleRun,
  pinnedRun,
  selectedRunIds,
  trackingData = [],
}) => {
  return (
    <div className="details-dataset">
      {trackingData.map((dataset) => {
        const { data, datasetName } = dataset;

        return (
          <Accordion
            className="details-dataset__accordion"
            heading={datasetName}
            headingClassName="details-dataset__accordion-header"
            key={dataset.datasetName}
            layout="left"
            size="large"
          >
            {Object.keys(data)
              .sort((a, b) => {
                return a.localeCompare(b);
              })
              .map((key, rowIndex) => {
                return buildDatasetDataMarkup(
                  key,
                  dataset.data[key],
                  rowIndex,
                  pinnedRun,
                  enableShowChanges,
                  enableComparisonView,
                  selectedRunIds
                );
              })}
          </Accordion>
        );
      })}
    </div>
  );
};

/**
 * Build the necessary markup used to display the run dataset.
 * @param {string} datasetKey The row label of the data.
 * @param {array} datasetValues A single dataset array from a run.
 * @param {number} rowIndex The array index of the dataset data.
 * @param {boolean} enableComparisonView Whether or not the enableComparisonView is on
 * @param {string} pinnedRun ID of the pinned run.
 * @param {boolean} enableShowChanges Are changes enabled or not.
 * @param {array} selectedRunIds Array of strings of runIds.
 */
function buildDatasetDataMarkup(
  datasetKey,
  datasetValues,
  rowIndex,
  pinnedRun,
  enableShowChanges,
  enableComparisonView,
  selectedRunIds,
  isSingleRun
) {
  const updatedDatasetValues = fillEmptyMetrics(datasetValues, selectedRunIds);
  const runDataWithPin = resolveRunDataWithPin(updatedDatasetValues, pinnedRun);

  return (
    <React.Fragment key={datasetKey + rowIndex}>
      {rowIndex === 0 ? (
        <div className="details-dataset__row">
          <span className="details-dataset__name-header">Name</span>
          {datasetValues.map((value, index) => (
            <span
              className={classnames('details-dataset__value-header', {
                'details-dataset__value-header--comparision-view':
                  index === 0 && enableComparisonView,
              })}
              key={value.runId + index}
            >
              Value
            </span>
          ))}
        </div>
      ) : null}
      <TransitionGroup component="div" className="details-dataset__row">
        <span className={'details-dataset__label'}>{datasetKey}</span>
        {runDataWithPin.map((data, index) => {
          return (
            <CSSTransition
              key={data.runId}
              timeout={300}
              classNames="details-dataset__value-animation"
              enter={isSingleRun ? false : true}
              exit={isSingleRun ? false : true}
            >
              <span
                className={classnames('details-dataset__value', {
                  'details-dataset__value--comparision-view':
                    index === 0 && enableComparisonView,
                })}
                key={data.runId + index}
              >
                {sanitizeValue(data.value)}
                {enableShowChanges && <PinArrowIcon icon={data.pinIcon} />}
              </span>
            </CSSTransition>
          );
        })}
      </TransitionGroup>
    </React.Fragment>
  );
}

/**
 * Fill in missing run metrics if they don't match the number of runIds.
 * @param {array} datasetValues Array of objects for a metric, e.g. r2_score.
 * @param {array} selectedRunIds Array of strings of runIds.
 * @returns Array of objects, the length of which matches the length
 * of the selectedRunIds.
 */
function fillEmptyMetrics(datasetValues, selectedRunIds) {
  if (datasetValues.length === selectedRunIds.length) {
    return datasetValues;
  }

  const metrics = [];

  selectedRunIds.forEach((id) => {
    const foundIdIndex = datasetValues.findIndex((item) => {
      return item.runId === id;
    });

    // We didn't find a metric with this runId, so add a placeholder.
    if (foundIdIndex === -1) {
      metrics.push({ runId: id, value: null });
    } else {
      metrics.push(datasetValues[foundIdIndex]);
    }
  });

  return metrics;
}

export default RunDataset;
