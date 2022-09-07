import React from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';
import PinArrowIcon from '../../icons/pin-arrow';
import PlotlyChart from '../../plotly-chart';
import { sanitizeValue } from '../../../utils/experiment-tracking-utils';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { DataSetLoader } from './run-dataset-loader';

import getShortType from '../../../utils/short-type';
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
 * @param {object} props.trackingData The experiment tracking run data.
 */
const RunDataset = ({
  enableComparisonView,
  enableShowChanges,
  isSingleRun,
  pinnedRun,
  setRunDatasetToShow,
  setShowRunPlotsModal,
  showLoader,
  trackingData,
  theme,
}) => {
  if (!trackingData) {
    return null;
  }

  return (
    <div className="details-dataset">
      {Object.keys(trackingData).map((group) => {
        return (
          <Accordion
            className={classnames(
              'details-dataset__accordion',
              'details-dataset__accordion-wrapper',
              {
                'details-dataset__accordion-wrapper-comparison-view':
                  enableComparisonView,
              }
            )}
            headingClassName="details-dataset__accordion-header"
            heading={group}
            key={group}
            layout="left"
            size="large"
          >
            {trackingData[group].map((dataset) => {
              const { data, datasetType, datasetName, runIds } = dataset;
              return (
                <Accordion
                  className="details-dataset__accordion"
                  heading={datasetName}
                  headingClassName="details-dataset__accordion-header"
                  key={datasetName}
                  layout="left"
                  size="medium"
                >
                  {Object.keys(data)
                    .sort((a, b) => {
                      return a.localeCompare(b);
                    })
                    .map((key, rowIndex) => {
                      const updatedDatasetValues = fillEmptyMetrics(
                        dataset.data[key],
                        runIds
                      );
                      const runDataWithPin = resolveRunDataWithPin(
                        updatedDatasetValues,
                        pinnedRun
                      );

                      return buildDatasetDataMarkup(
                        key,
                        runDataWithPin,
                        datasetType,
                        rowIndex,
                        isSingleRun,
                        enableComparisonView,
                        enableShowChanges,
                        setRunDatasetToShow,
                        setShowRunPlotsModal,
                        showLoader,
                        theme
                      );
                    })}
                </Accordion>
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
 * @param {boolean} isSingleRun Whether or not this is a single run.
 * @param {boolean} enableShowChanges Are changes enabled or not.
 * @param {boolean} enableComparisonView Whether or not the enableComparisonView is on
 * @param {function} setRunDatasetToShow callbak function to show runDataset
 * @param {function} setShowRunPlotsModal callbak function to show runplot modal
 */
function buildDatasetDataMarkup(
  datasetKey,
  datasetValues,
  datasetType,
  rowIndex,
  isSingleRun,
  enableComparisonView,
  enableShowChanges,
  setRunDatasetToShow,
  setShowRunPlotsModal,
  showLoader,
  theme
) {
  const isPlotlyDataset = getShortType(datasetType) === 'plotly';
  const isImageDataset = getShortType(datasetType) === 'image';
  const isTrackingDataset = getShortType(datasetType) === 'tracking';

  const onExpandVizClick = () => {
    setShowRunPlotsModal(true);
    setRunDatasetToShow({ datasetKey, datasetType, datasetValues });
  };

  return (
    <React.Fragment key={datasetKey + rowIndex}>
      {rowIndex === 0 ? (
        <div className="details-dataset__row">
          <span className="details-dataset__name-header">Name</span>
          <TransitionGroup
            component="div"
            className="details-dataset__tranistion-group-wrapper"
          >
            {datasetValues.map((data, index) => (
              <CSSTransition
                key={data.runId}
                timeout={300}
                classNames="details-dataset__value-animation"
                enter={isSingleRun ? false : true}
                exit={isSingleRun ? false : true}
              >
                <span
                  className={classnames('details-dataset__value-header', {
                    'details-dataset__value-header--comparison-view':
                      index === 0 && enableComparisonView,
                  })}
                >
                  Value
                </span>
              </CSSTransition>
            ))}
          </TransitionGroup>
          {showLoader && (
            <DataSetLoader
              length={datasetValues.length}
              theme={theme}
              x={0}
              y={12}
            />
          )}
        </div>
      ) : null}
      <div className="details-dataset__row">
        <span className={'details-dataset__label'}>{datasetKey}</span>
        <TransitionGroup
          component="div"
          className="details-dataset__tranistion-group-wrapper"
        >
          {datasetValues.map((run, index) => {
            const isSinglePinnedRun = datasetValues.length === 1;
            return (
              <CSSTransition
                key={run.runId}
                timeout={300}
                classNames="details-dataset__value-animation"
                enter={isSinglePinnedRun ? false : true}
                exit={isSinglePinnedRun ? false : true}
              >
                <span
                  className={classnames('details-dataset__value', {
                    'details-dataset__value--comparison-view':
                      index === 0 && enableComparisonView,
                  })}
                >
                  {isTrackingDataset && (
                    <>
                      {sanitizeValue(run?.value)}
                      {enableShowChanges && <PinArrowIcon icon={run.pinIcon} />}
                    </>
                  )}

                  {isPlotlyDataset &&
                    (run.value ? (
                      <div
                        className="details-dataset__visualization-wrapper"
                        onClick={onExpandVizClick}
                      >
                        <PlotlyChart
                          data={run.value.data}
                          layout={run.value.layout}
                          view="experiment_preview"
                        />
                      </div>
                    ) : (
                      fillEmptyPlots()
                    ))}

                  {isImageDataset &&
                    (run.value ? (
                      <div
                        className="details-dataset__image-container"
                        onClick={onExpandVizClick}
                      >
                        <img
                          alt="Matplotlib rendering"
                          className="details-dataset__image"
                          src={`data:image/png;base64,${run.value}`}
                        />
                      </div>
                    ) : (
                      fillEmptyPlots()
                    ))}
                </span>
              </CSSTransition>
            );
          })}
        </TransitionGroup>
        {showLoader && (
          <DataSetLoader
            length={datasetValues.length}
            theme={theme}
            x={0}
            y={12}
          />
        )}
      </div>
    </React.Fragment>
  );
}

/**
 * Fill in missing run metrics if they don't match the number of runIds.
 * @param {array} datasetValues Array of objects for a metric, e.g. r2_score.
 * @param {array} runIds Array of strings of runIds.
 * @returns Array of objects, the length of which matches the length
 * of the runIds.
 */
function fillEmptyMetrics(datasetValues, runIds) {
  if (datasetValues.length === runIds.length) {
    return datasetValues;
  }

  const metrics = [];

  runIds.forEach((id) => {
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

function fillEmptyPlots() {
  return <div className="details-dataset__empty-plot">No plot available</div>;
}

export default RunDataset;
