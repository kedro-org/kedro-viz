/* eslint-disable */

import React from 'react';
import classnames from 'classnames';
import Accordion from '../accordion';
import PinArrowIcon from '../../icons/pin-arrow';
import PlotlyChart from '../../plotly-chart';
import { sanitizeValue } from '../../../utils/experiment-tracking-utils';
import getShortType from '../../../utils/short-type';
import './run-dataset.css';

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
  enableShowChanges,
  isSingleRun,
  pinnedRun,
  selectedRunIds,
  setRunDatasetToShow,
  setShowRunPlotsModal,
  trackingData,
}) => {
  return (
    <div
      className={classnames('details-dataset', {
        'details-dataset--single': isSingleRun,
      })}
    >
      {Object.keys(trackingData).map((group) => {
        return (
          <Accordion
            className="details-dataset__accordion"
            headingClassName="details-dataset__accordion-header"
            heading={group}
            key={group}
            layout="left"
            size="large"
          >
            {trackingData[group].map((dataset) => {
              const { data, datasetType, datasetName } = dataset;

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
                      return buildDatasetDataMarkup(
                        key,
                        dataset.data[key],
                        datasetType,
                        rowIndex,
                        isSingleRun,
                        pinnedRun,
                        enableShowChanges,
                        selectedRunIds,
                        setRunDatasetToShow,
                        setShowRunPlotsModal
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
 * @param {string} pinnedRun ID of the pinned run.
 * @param {boolean} enableShowChanges Are changes enabled or not.
 * @param {array} selectedRunIds Array of strings of runIds.
 */
function buildDatasetDataMarkup(
  datasetKey,
  datasetValues,
  datasetType,
  rowIndex,
  isSingleRun,
  pinnedRun,
  enableShowChanges,
  selectedRunIds,
  setRunDatasetToShow,
  setShowRunPlotsModal
) {
  const updatedDatasetValues = fillEmptyMetrics(datasetValues, selectedRunIds);
  const runDataWithPin = resolveRunDataWithPin(updatedDatasetValues, pinnedRun);

  const isPlotlyDataset = getShortType(datasetType) === 'plotly';
  const isImageDataset = getShortType(datasetType) === 'image';
  const isTrackingDataset = getShortType(datasetType) === 'tracking';

  const onExpandVizClick = () => {
    setShowRunPlotsModal(true);
    setRunDatasetToShow({ datasetKey, datasetType, runDataWithPin });
  };

  return (
    <React.Fragment key={datasetKey + rowIndex}>
      {rowIndex === 0 ? (
        <div className="details-dataset__row">
          <span
            className={classnames('details-dataset__name-header', {
              'details-dataset__value-header--single': isSingleRun,
            })}
          >
            Name
          </span>
          {selectedRunIds.map((value, index) => (
            <span
              className={classnames('details-dataset__value-header', {
                'details-dataset__value-header--single': isSingleRun,
              })}
              key={value + index}
            >
              Value
            </span>
          ))}
        </div>
      ) : null}
      <div className="details-dataset__row">
        <span
          className={classnames('details-dataset__label', {
            'details-dataset__label--single': isSingleRun,
          })}
        >
          {datasetKey}
        </span>
        {isTrackingDataset &&
          runDataWithPin.map((data) => (
            <span
              className={classnames('details-dataset__value', {
                'details-dataset__value--single': isSingleRun,
              })}
              key={data.runId}
            >
              {sanitizeValue(data.value)}
              {enableShowChanges && <PinArrowIcon icon={data.pinIcon} />}
            </span>
          ))}
        {isPlotlyDataset &&
          selectedRunIds.map((value, index) => {
            return (
              <React.Fragment key={value}>
                <span
                  className={classnames('details-dataset__value', {
                    'details-dataset__value--single': isSingleRun,
                  })}
                >
                  {runDataWithPin[index].value ? (
                    <div
                      className="details-dataset__visualization-wrapper"
                      onClick={onExpandVizClick}
                    >
                      {runDataWithPin[index].value && (
                        <PlotlyChart
                          data={[
                            {
                              alignmentgroup: 'True',
                              hovertemplate:
                                'cancellation_policy=strict<br>company_location=%{x}<br>fleet_price=%{y}<extra></extra>',
                              legendgroup: 'strict',
                              marker: {
                                color: '#636efa',
                                pattern: { shape: '' },
                              },
                              name: 'strict',
                              offsetgroup: 'strict',
                              orientation: 'v',
                              showlegend: true,
                              textposition: 'auto',
                              type: 'bar',
                              x: [
                                'Antigua and Barbuda',
                                'Benin',
                                'Ireland',
                                'Jordan',
                                'Latvia',
                                'Samoa',
                                'Tajikistan',
                                'Tuvalu',
                                'United States Minor Outlying Islands',
                              ],
                              xaxis: 'x',
                              y: [
                                1650.0, 2807.0, 2430.0, 2352.0, 1416.0, 2365.0,
                                3210.0, 1910.0, 1455.0,
                              ],
                              yaxis: 'y',
                            },
                            {
                              alignmentgroup: 'True',
                              hovertemplate:
                                'cancellation_policy=moderate<br>company_location=%{x}<br>fleet_price=%{y}<extra></extra>',
                              legendgroup: 'moderate',
                              marker: {
                                color: '#EF553B',
                                pattern: { shape: '' },
                              },
                              name: 'moderate',
                              offsetgroup: 'moderate',
                              orientation: 'v',
                              showlegend: true,
                              textposition: 'auto',
                              type: 'bar',
                              x: [
                                'Argentina',
                                'Bahamas',
                                'British Indian Ocean Territory (Chagos Archipelago)',
                                'Cyprus',
                                'Guatemala',
                                'Guyana',
                                "Lao People's Democratic Republic",
                                'Latvia',
                                'Namibia',
                                'Sri Lanka',
                              ],
                              xaxis: 'x',
                              y: [
                                2430.0, 2066.0, 2170.0, 1585.0, 3470.0, 2222.0,
                                3145.0, 2027.0, 2690.0, 2040.0,
                              ],
                              yaxis: 'y',
                            },
                            {
                              alignmentgroup: 'True',
                              hovertemplate:
                                'cancellation_policy=flexible<br>company_location=%{x}<br>fleet_price=%{y}<extra></extra>',
                              legendgroup: 'flexible',
                              marker: {
                                color: '#00cc96',
                                pattern: { shape: '' },
                              },
                              name: 'flexible',
                              offsetgroup: 'flexible',
                              orientation: 'v',
                              showlegend: true,
                              textposition: 'auto',
                              type: 'bar',
                              x: ['Bhutan', 'Eritrea'],
                              xaxis: 'x',
                              y: [1845.0, 2105.0],
                              yaxis: 'y',
                            },
                          ]}
                          layout={{
                            barmode: 'relative',
                            legend: {
                              title: { text: 'cancellation_policy' },
                              tracegroupgap: 0,
                            },
                            margin: { t: 60 },
                            template: {
                              data: {
                                bar: [
                                  {
                                    error_x: { color: '#2a3f5f' },
                                    error_y: { color: '#2a3f5f' },
                                    marker: {
                                      line: { color: '#E5ECF6', width: 0.5 },
                                      pattern: {
                                        fillmode: 'overlay',
                                        size: 10,
                                        solidity: 0.2,
                                      },
                                    },
                                    type: 'bar',
                                  },
                                ],
                                barpolar: [
                                  {
                                    marker: {
                                      line: { color: '#E5ECF6', width: 0.5 },
                                      pattern: {
                                        fillmode: 'overlay',
                                        size: 10,
                                        solidity: 0.2,
                                      },
                                    },
                                    type: 'barpolar',
                                  },
                                ],
                                carpet: [
                                  {
                                    aaxis: {
                                      endlinecolor: '#2a3f5f',
                                      gridcolor: 'white',
                                      linecolor: 'white',
                                      minorgridcolor: 'white',
                                      startlinecolor: '#2a3f5f',
                                    },
                                    baxis: {
                                      endlinecolor: '#2a3f5f',
                                      gridcolor: 'white',
                                      linecolor: 'white',
                                      minorgridcolor: 'white',
                                      startlinecolor: '#2a3f5f',
                                    },
                                    type: 'carpet',
                                  },
                                ],
                                choropleth: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    type: 'choropleth',
                                  },
                                ],
                                contour: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    colorscale: [
                                      [0.0, '#0d0887'],
                                      [0.1111111111111111, '#46039f'],
                                      [0.2222222222222222, '#7201a8'],
                                      [0.3333333333333333, '#9c179e'],
                                      [0.4444444444444444, '#bd3786'],
                                      [0.5555555555555556, '#d8576b'],
                                      [0.6666666666666666, '#ed7953'],
                                      [0.7777777777777778, '#fb9f3a'],
                                      [0.8888888888888888, '#fdca26'],
                                      [1.0, '#f0f921'],
                                    ],
                                    type: 'contour',
                                  },
                                ],
                                contourcarpet: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    type: 'contourcarpet',
                                  },
                                ],
                                heatmap: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    colorscale: [
                                      [0.0, '#0d0887'],
                                      [0.1111111111111111, '#46039f'],
                                      [0.2222222222222222, '#7201a8'],
                                      [0.3333333333333333, '#9c179e'],
                                      [0.4444444444444444, '#bd3786'],
                                      [0.5555555555555556, '#d8576b'],
                                      [0.6666666666666666, '#ed7953'],
                                      [0.7777777777777778, '#fb9f3a'],
                                      [0.8888888888888888, '#fdca26'],
                                      [1.0, '#f0f921'],
                                    ],
                                    type: 'heatmap',
                                  },
                                ],
                                heatmapgl: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    colorscale: [
                                      [0.0, '#0d0887'],
                                      [0.1111111111111111, '#46039f'],
                                      [0.2222222222222222, '#7201a8'],
                                      [0.3333333333333333, '#9c179e'],
                                      [0.4444444444444444, '#bd3786'],
                                      [0.5555555555555556, '#d8576b'],
                                      [0.6666666666666666, '#ed7953'],
                                      [0.7777777777777778, '#fb9f3a'],
                                      [0.8888888888888888, '#fdca26'],
                                      [1.0, '#f0f921'],
                                    ],
                                    type: 'heatmapgl',
                                  },
                                ],
                                histogram: [
                                  {
                                    marker: {
                                      pattern: {
                                        fillmode: 'overlay',
                                        size: 10,
                                        solidity: 0.2,
                                      },
                                    },
                                    type: 'histogram',
                                  },
                                ],
                                histogram2d: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    colorscale: [
                                      [0.0, '#0d0887'],
                                      [0.1111111111111111, '#46039f'],
                                      [0.2222222222222222, '#7201a8'],
                                      [0.3333333333333333, '#9c179e'],
                                      [0.4444444444444444, '#bd3786'],
                                      [0.5555555555555556, '#d8576b'],
                                      [0.6666666666666666, '#ed7953'],
                                      [0.7777777777777778, '#fb9f3a'],
                                      [0.8888888888888888, '#fdca26'],
                                      [1.0, '#f0f921'],
                                    ],
                                    type: 'histogram2d',
                                  },
                                ],
                                histogram2dcontour: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    colorscale: [
                                      [0.0, '#0d0887'],
                                      [0.1111111111111111, '#46039f'],
                                      [0.2222222222222222, '#7201a8'],
                                      [0.3333333333333333, '#9c179e'],
                                      [0.4444444444444444, '#bd3786'],
                                      [0.5555555555555556, '#d8576b'],
                                      [0.6666666666666666, '#ed7953'],
                                      [0.7777777777777778, '#fb9f3a'],
                                      [0.8888888888888888, '#fdca26'],
                                      [1.0, '#f0f921'],
                                    ],
                                    type: 'histogram2dcontour',
                                  },
                                ],
                                mesh3d: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    type: 'mesh3d',
                                  },
                                ],
                                parcoords: [
                                  {
                                    line: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'parcoords',
                                  },
                                ],
                                pie: [{ automargin: true, type: 'pie' }],
                                scatter: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scatter',
                                  },
                                ],
                                scatter3d: [
                                  {
                                    line: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scatter3d',
                                  },
                                ],
                                scattercarpet: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scattercarpet',
                                  },
                                ],
                                scattergeo: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scattergeo',
                                  },
                                ],
                                scattergl: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scattergl',
                                  },
                                ],
                                scattermapbox: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scattermapbox',
                                  },
                                ],
                                scatterpolar: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scatterpolar',
                                  },
                                ],
                                scatterpolargl: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scatterpolargl',
                                  },
                                ],
                                scatterternary: [
                                  {
                                    marker: {
                                      colorbar: { outlinewidth: 0, ticks: '' },
                                    },
                                    type: 'scatterternary',
                                  },
                                ],
                                surface: [
                                  {
                                    colorbar: { outlinewidth: 0, ticks: '' },
                                    colorscale: [
                                      [0.0, '#0d0887'],
                                      [0.1111111111111111, '#46039f'],
                                      [0.2222222222222222, '#7201a8'],
                                      [0.3333333333333333, '#9c179e'],
                                      [0.4444444444444444, '#bd3786'],
                                      [0.5555555555555556, '#d8576b'],
                                      [0.6666666666666666, '#ed7953'],
                                      [0.7777777777777778, '#fb9f3a'],
                                      [0.8888888888888888, '#fdca26'],
                                      [1.0, '#f0f921'],
                                    ],
                                    type: 'surface',
                                  },
                                ],
                                table: [
                                  {
                                    cells: {
                                      fill: { color: '#EBF0F8' },
                                      line: { color: 'white' },
                                    },
                                    header: {
                                      fill: { color: '#C8D4E3' },
                                      line: { color: 'white' },
                                    },
                                    type: 'table',
                                  },
                                ],
                              },
                              layout: {
                                annotationdefaults: {
                                  arrowcolor: '#2a3f5f',
                                  arrowhead: 0,
                                  arrowwidth: 1,
                                },
                                autotypenumbers: 'strict',
                                coloraxis: {
                                  colorbar: { outlinewidth: 0, ticks: '' },
                                },
                                colorscale: {
                                  diverging: [
                                    [0, '#8e0152'],
                                    [0.1, '#c51b7d'],
                                    [0.2, '#de77ae'],
                                    [0.3, '#f1b6da'],
                                    [0.4, '#fde0ef'],
                                    [0.5, '#f7f7f7'],
                                    [0.6, '#e6f5d0'],
                                    [0.7, '#b8e186'],
                                    [0.8, '#7fbc41'],
                                    [0.9, '#4d9221'],
                                    [1, '#276419'],
                                  ],
                                  sequential: [
                                    [0.0, '#0d0887'],
                                    [0.1111111111111111, '#46039f'],
                                    [0.2222222222222222, '#7201a8'],
                                    [0.3333333333333333, '#9c179e'],
                                    [0.4444444444444444, '#bd3786'],
                                    [0.5555555555555556, '#d8576b'],
                                    [0.6666666666666666, '#ed7953'],
                                    [0.7777777777777778, '#fb9f3a'],
                                    [0.8888888888888888, '#fdca26'],
                                    [1.0, '#f0f921'],
                                  ],
                                  sequentialminus: [
                                    [0.0, '#0d0887'],
                                    [0.1111111111111111, '#46039f'],
                                    [0.2222222222222222, '#7201a8'],
                                    [0.3333333333333333, '#9c179e'],
                                    [0.4444444444444444, '#bd3786'],
                                    [0.5555555555555556, '#d8576b'],
                                    [0.6666666666666666, '#ed7953'],
                                    [0.7777777777777778, '#fb9f3a'],
                                    [0.8888888888888888, '#fdca26'],
                                    [1.0, '#f0f921'],
                                  ],
                                },
                                colorway: [
                                  '#636efa',
                                  '#EF553B',
                                  '#00cc96',
                                  '#ab63fa',
                                  '#FFA15A',
                                  '#19d3f3',
                                  '#FF6692',
                                  '#B6E880',
                                  '#FF97FF',
                                  '#FECB52',
                                ],
                                font: { color: '#2a3f5f' },
                                geo: {
                                  bgcolor: 'white',
                                  lakecolor: 'white',
                                  landcolor: '#E5ECF6',
                                  showlakes: true,
                                  showland: true,
                                  subunitcolor: 'white',
                                },
                                hoverlabel: { align: 'left' },
                                hovermode: 'closest',
                                mapbox: { style: 'light' },
                                paper_bgcolor: 'white',
                                plot_bgcolor: '#E5ECF6',
                                polar: {
                                  angularaxis: {
                                    gridcolor: 'white',
                                    linecolor: 'white',
                                    ticks: '',
                                  },
                                  bgcolor: '#E5ECF6',
                                  radialaxis: {
                                    gridcolor: 'white',
                                    linecolor: 'white',
                                    ticks: '',
                                  },
                                },
                                scene: {
                                  xaxis: {
                                    backgroundcolor: '#E5ECF6',
                                    gridcolor: 'white',
                                    gridwidth: 2,
                                    linecolor: 'white',
                                    showbackground: true,
                                    ticks: '',
                                    zerolinecolor: 'white',
                                  },
                                  yaxis: {
                                    backgroundcolor: '#E5ECF6',
                                    gridcolor: 'white',
                                    gridwidth: 2,
                                    linecolor: 'white',
                                    showbackground: true,
                                    ticks: '',
                                    zerolinecolor: 'white',
                                  },
                                  zaxis: {
                                    backgroundcolor: '#E5ECF6',
                                    gridcolor: 'white',
                                    gridwidth: 2,
                                    linecolor: 'white',
                                    showbackground: true,
                                    ticks: '',
                                    zerolinecolor: 'white',
                                  },
                                },
                                shapedefaults: { line: { color: '#2a3f5f' } },
                                ternary: {
                                  aaxis: {
                                    gridcolor: 'white',
                                    linecolor: 'white',
                                    ticks: '',
                                  },
                                  baxis: {
                                    gridcolor: 'white',
                                    linecolor: 'white',
                                    ticks: '',
                                  },
                                  bgcolor: '#E5ECF6',
                                  caxis: {
                                    gridcolor: 'white',
                                    linecolor: 'white',
                                    ticks: '',
                                  },
                                },
                                title: { x: 0.05 },
                                xaxis: {
                                  automargin: true,
                                  gridcolor: 'white',
                                  linecolor: 'white',
                                  ticks: '',
                                  title: { standoff: 15 },
                                  zerolinecolor: 'white',
                                  zerolinewidth: 2,
                                },
                                yaxis: {
                                  automargin: true,
                                  gridcolor: 'white',
                                  linecolor: 'white',
                                  ticks: '',
                                  title: { standoff: 15 },
                                  zerolinecolor: 'white',
                                  zerolinewidth: 2,
                                },
                              },
                            },
                            xaxis: {
                              anchor: 'y',
                              domain: [0.0, 1.0],
                              title: { text: 'company_location' },
                            },
                            yaxis: {
                              anchor: 'x',
                              domain: [0.0, 1.0],
                              title: { text: 'fleet_price' },
                              type: 'log',
                            },
                          }}
                          view="experiment_preview"
                        />
                      )}
                    </div>
                  ) : (
                    fillEmptyPlots()
                  )}
                </span>
              </React.Fragment>
            );
          })}
        {isImageDataset &&
          selectedRunIds.map((value, index) => {
            return (
              <React.Fragment key={value}>
                <span
                  className={classnames('details-dataset__value', {
                    'details-dataset__value--single': isSingleRun,
                  })}
                >
                  {runDataWithPin[index].value ? (
                    <div
                      className="details-dataset__image-container"
                      onClick={onExpandVizClick}
                    >
                      <img
                        alt="Matplotlib rendering"
                        className="details-dataset__image"
                        src={`data:image/png;base64,${runDataWithPin[index].value}`}
                      />
                    </div>
                  ) : (
                    fillEmptyPlots()
                  )}
                </span>
              </React.Fragment>
            );
          })}
      </div>
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

function fillEmptyPlots() {
  return <div className="details-dataset__empty-plot">No plot available</div>;
}

export default RunDataset;
