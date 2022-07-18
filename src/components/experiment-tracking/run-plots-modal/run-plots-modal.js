import React from 'react';
import PlotlyChart from '../../plotly-chart';
import BackIcon from '../../icons/back';
import NodeIcon from '../../icons/node-icon';
import './run-plots-modal.css';
import getShortType from '../../../utils/short-type';
import classNames from 'classnames';

const RunPlotsModal = ({ runDatasetToShow, visible, setShowRunPlotsModal }) => {
  if (!visible) {
    return null;
  }
  const { datasetKey, datasetType, runDataWithPin } = runDatasetToShow;
  const numDatasets = runDataWithPin.length;
  const plotView =
    numDatasets === 3
      ? 'threeChart'
      : numDatasets === 2
      ? 'twoChart'
      : 'oneChart';
  const isPlotly = getShortType(datasetType) === 'plotly';
  const isImage = getShortType(datasetType) === 'image';
  const nodeTypeIcon = getShortType(datasetType);

  return (
    <div className="pipeline-run-plots-modal">
      <div className="pipeline-run-plots-modal__top">
        <button
          className="pipeline-run-plots-modal__back"
          onClick={() => setShowRunPlotsModal(false)}
        >
          <BackIcon className="pipeline-run-plots-modal__back-icon"></BackIcon>
          <span className="pipeline-run-plots-modal__back-text">Back</span>
        </button>
        <div className="pipeline-run-plots-modal__header">
          <NodeIcon
            className="pipeline-run-plots-modal__icon"
            icon={nodeTypeIcon}
          />
          <span className="pipeline-run-plots-modal__title">{datasetKey}</span>
        </div>
      </div>
      <div
        className={classNames(
          'pipeline-run-plots-modal__content',
          `pipeline-run-plots-modal__content--${plotView}`
        )}
      >
        {isPlotly &&
          runDataWithPin.map(
            (data) =>
              data.value && (
                <PlotlyChart
                  data={data.value.data}
                  layout={data.value.layout}
                  view={plotView}
                />
              )
          )}
        {isImage &&
          runDataWithPin.map((data) => {
            return (
              <div
                className={`pipeline-run-plots__wrapper--${plotView}`}
                key={data.runId}
              >
                <img
                  alt="Matplotlib rendering"
                  className={classNames(
                    `pipeline-run-plots__image--${plotView}`
                  )}
                  src={`data:image/png;base64,${data.value}`}
                />
                <div>{data.runId}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default RunPlotsModal;
