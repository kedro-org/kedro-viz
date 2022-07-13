import React from 'react';
import PlotlyChart from '../../plotly-chart';
import BackIcon from '../../icons/back';
import NodeIcon from '../../icons/node-icon';
import './run-viz-modal.css';
import getShortType from '../../../utils/short-type';

const RunVizModal = ({ runDatasetToShow, visible, setShowRunVizModal }) => {
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
  const nodeTypeIcon = getShortType(datasetType);

  return (
    <div className="pipeline-run-viz-modal">
      <div className="pipeline-run-viz-modal__top">
        <button
          className="pipeline-run-viz-modal__back"
          onClick={() => setShowRunVizModal(false)}
        >
          <BackIcon className="pipeline-run-viz-modal__back-icon"></BackIcon>
          <span className="pipeline-run-viz-modal__back-text">Back</span>
        </button>
        <div className="pipeline-run-viz-modal__header">
          <NodeIcon
            className="pipeline-run-viz-modal__icon"
            icon={nodeTypeIcon}
          />
          <span className="pipeline-run-viz-modal__title">{datasetKey}</span>
        </div>
      </div>
      <div className="pipeline-run-viz-modal__content">
        {isPlotly &&
          runDataWithPin.map(
            (data, index) =>
              data.value && (
                <PlotlyChart
                  data={data.value.data}
                  layout={data.value.layout}
                  view={plotView}
                />
              )
          )}
      </div>

      {/* {hasImage && (
        <div className="pipeline-matplotlib-chart">
          <div className="pipeline-run-viz__plot-image-container">
            <img
              alt="Matplotlib rendering"
              className="pipeline-run-viz__plot-image--expanded"
              src={`data:image/png;base64,${metadata.image}`}
            />
          </div>
        </div>
      )} */}
    </div>
  );
};

export default RunVizModal;
