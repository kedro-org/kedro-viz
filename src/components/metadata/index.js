import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import modifiers from '../../utils/modifiers';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/icon-button';
import CopyIcon from '../icons/copy';
import CloseIcon from '../icons/close';
import PlotlyChart from '../plotly-chart';
import MetaDataRow from './metadata-row';
import MetaDataValue from './metadata-value';
import MetaDataCode from './metadata-code';
import MetaCodeToggle from './metadata-code-toggle';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData,
} from '../../selectors/metadata';
import { toggleNodeClicked } from '../../actions/nodes';
import { toggleCode } from '../../actions';
import './styles/metadata.css';

const plotData = {
  data: [
    {
      hovertemplate: 'importance=%{x}<br>features=%{y}<extra></extra>',
      legendgroup: '',
      marker: {
        color: '#636efa',
        symbol: 'circle',
      },
      mode: 'markers',
      name: '',
      orientation: 'h',
      showlegend: false,
      type: 'scatter',
      x: [98, 90, 94, 97, 31, 27, 0, 90, 5, 89, 30, 31, 3, 99, 45, 59],
      xaxis: 'x',
      y: [
        'feature1',
        'feature2',
        'feature3',
        'feature4',
        'feature5',
        'feature6',
        'feature7',
        'feature8',
        'feature9',
        'feature10',
        'feature11',
        'feature12',
        'feature13',
        'feature14',
        'feature15',
        'feature16',
      ],
      yaxis: 'y',
    },
  ],
  layout: {
    legend: {
      tracegroupgap: 0,
    },
    margin: {
      t: 60,
    },
    template: {
      data: {
        bar: [
          {
            error_x: {
              color: '#2a3f5f',
            },
            error_y: {
              color: '#2a3f5f',
            },
            marker: {
              line: {
                color: '#E5ECF6',
                width: 0.5,
              },
            },
            type: 'bar',
          },
        ],
        barpolar: [
          {
            marker: {
              line: {
                color: '#E5ECF6',
                width: 0.5,
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
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
            type: 'choropleth',
          },
        ],
        contour: [
          {
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
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
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
            type: 'contourcarpet',
          },
        ],
        heatmap: [
          {
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
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
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
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
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'histogram',
          },
        ],
        histogram2d: [
          {
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
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
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
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
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
            type: 'mesh3d',
          },
        ],
        parcoords: [
          {
            line: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'parcoords',
          },
        ],
        pie: [
          {
            automargin: true,
            type: 'pie',
          },
        ],
        scatter: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scatter',
          },
        ],
        scatter3d: [
          {
            line: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scatter3d',
          },
        ],
        scattercarpet: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scattercarpet',
          },
        ],
        scattergeo: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scattergeo',
          },
        ],
        scattergl: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scattergl',
          },
        ],
        scattermapbox: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scattermapbox',
          },
        ],
        scatterpolar: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scatterpolar',
          },
        ],
        scatterpolargl: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scatterpolargl',
          },
        ],
        scatterternary: [
          {
            marker: {
              colorbar: {
                outlinewidth: 0,
                ticks: '',
              },
            },
            type: 'scatterternary',
          },
        ],
        surface: [
          {
            colorbar: {
              outlinewidth: 0,
              ticks: '',
            },
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
              fill: {
                color: '#EBF0F8',
              },
              line: {
                color: 'white',
              },
            },
            header: {
              fill: {
                color: '#C8D4E3',
              },
              line: {
                color: 'white',
              },
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
          colorbar: {
            outlinewidth: 0,
            ticks: '',
          },
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
        font: {
          color: '#2a3f5f',
        },
        geo: {
          bgcolor: 'white',
          lakecolor: 'white',
          landcolor: '#E5ECF6',
          showlakes: true,
          showland: true,
          subunitcolor: 'white',
        },
        hoverlabel: {
          align: 'left',
        },
        hovermode: 'closest',
        mapbox: {
          style: 'light',
        },
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
        shapedefaults: {
          line: {
            color: '#2a3f5f',
          },
        },
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
        title: {
          x: 0.05,
        },
        xaxis: {
          automargin: true,
          gridcolor: 'white',
          linecolor: 'white',
          ticks: '',
          title: {
            standoff: 15,
          },
          zerolinecolor: 'white',
          zerolinewidth: 2,
        },
        yaxis: {
          automargin: true,
          gridcolor: 'white',
          linecolor: 'white',
          ticks: '',
          title: {
            standoff: 15,
          },
          zerolinecolor: 'white',
          zerolinewidth: 2,
        },
      },
    },
    title: {
      text: 'Test',
    },
    xaxis: {
      anchor: 'y',
      domain: [0.0, 1.0],
      title: {
        text: 'x',
      },
    },
    yaxis: {
      anchor: 'x',
      domain: [0.0, 1.0],
      title: {
        text: 'y',
      },
    },
  },
  config: { modeBarButtonsToRemove: ['toImage'] },
};

/**
 * Shows node meta data
 */
const MetaData = ({
  visible = true,
  metadata,
  visibleCode,
  onToggleCode,
  onToggleNodeSelected,
}) => {
  const [showCopied, setShowCopied] = useState(false);

  // Hide code panel when selected metadata changes
  useEffect(() => onToggleCode(false), [metadata, onToggleCode]);

  const isTaskNode = metadata?.node.type === 'task';
  const isDataNode = metadata?.node.type === 'data';
  const isParametersNode = metadata?.node.type === 'parameters';

  const hasCode = Boolean(metadata?.code);
  const hasGraph = Boolean(metadata?.graph);
  const showCodePanel = visible && visibleCode && hasCode;
  const showCodeSwitch = hasCode;

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(metadata.runCommand);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const onCloseClick = () => {
    // Deselecting a node automatically hides MetaData panel
    onToggleNodeSelected(null);
  };

  return (
    <>
      <MetaDataCode visible={showCodePanel} value={metadata?.code} />
      <div className={modifiers('pipeline-metadata', { visible }, 'kedro')}>
        {metadata && (
          <>
            <div className="pipeline-metadata__header-toolbox">
              <div className="pipeline-metadata__header">
                <NodeIcon
                  className="pipeline-metadata__icon"
                  type={metadata.node.type}
                />
                <h2 className="pipeline-metadata__title">
                  {metadata.node.name}
                </h2>
              </div>
              <IconButton
                container={React.Fragment}
                ariaLabel="Close Metadata Panel"
                className={modifiers('pipeline-metadata__close-button', {
                  hasCode,
                })}
                icon={CloseIcon}
                onClick={onCloseClick}
              />
              {showCodeSwitch && (
                <MetaCodeToggle
                  showCode={visibleCode}
                  hasCode={hasCode}
                  onChange={(event) => onToggleCode(event.target.checked)}
                />
              )}
            </div>
            <dl className="pipeline-metadata__list">
              <MetaDataRow label="Type:" value={metadata.node.type} />
              <MetaDataRow
                label="Dataset Type:"
                visible={isDataNode}
                kind="type"
                value={metadata.datasetType}
              />
              <MetaDataRow
                label="File Path:"
                kind="path"
                value={metadata.filepath}
              />
              <MetaDataRow
                label={`Parameters (${metadata.parameters?.length || '-'}):`}
                visible={isParametersNode || isTaskNode}
                commas={false}
                inline={false}
                value={metadata.parameters}
                limit={10}
              />
              <MetaDataRow
                label="Inputs:"
                property="name"
                visible={isTaskNode}
                value={metadata.inputs}
              />
              <MetaDataRow
                label="Outputs:"
                property="name"
                visible={isTaskNode}
                value={metadata.outputs}
              />
              <MetaDataRow
                label="Tags:"
                kind="token"
                commas={false}
                value={metadata.tags}
              />
              <MetaDataRow
                label="Pipeline:"
                visible={Boolean(metadata.pipeline)}
                value={metadata.pipeline}
              />
              <MetaDataRow
                label="Run Command:"
                visible={Boolean(metadata.runCommand)}>
                <div className="pipeline-metadata__toolbox-container">
                  <MetaDataValue
                    container={'code'}
                    className={modifiers(
                      'pipeline-metadata__run-command-value',
                      {
                        visible: !showCopied,
                      }
                    )}
                    value={metadata.runCommand}
                  />
                  {window.navigator.clipboard && (
                    <>
                      <span
                        className={modifiers(
                          'pipeline-metadata__copy-message',
                          {
                            visible: showCopied,
                          }
                        )}>
                        Copied to clipboard.
                      </span>
                      <ul className="pipeline-metadata__toolbox">
                        <IconButton
                          ariaLabel="Copy run command to clipboard."
                          className="pipeline-metadata__copy-button"
                          icon={CopyIcon}
                          onClick={onCopyClick}
                        />
                      </ul>
                    </>
                  )}
                </div>
              </MetaDataRow>
              <MetaDataRow
                label="Description (docstring):"
                visible={isTaskNode}
                value={metadata.docstring}
              />
              <MetaDataRow label="Plotly Chart:" visible={isDataNode}>
                <div>
                  <PlotlyChart
                    data={plotData.data}
                    layout={plotData.layout}
                    config={plotData.config}
                  />
                </div>
              </MetaDataRow>
            </dl>
          </>
        )}
      </div>
    </>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  visible: getVisibleMetaSidebar(state),
  metadata: getClickedNodeMetaData(state),
  visibleCode: state.visible.code,
  ...ownProps,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleNodeSelected: (nodeID) => {
    dispatch(toggleNodeClicked(nodeID));
  },
  onToggleCode: (visible) => {
    dispatch(toggleCode(visible));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetaData);
