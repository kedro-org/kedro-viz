import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import modifiers from '../../utils/modifiers';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/icon-button';
import PlotlyChart from '../plotly-chart';
import CopyIcon from '../icons/copy';
import CloseIcon from '../icons/close';
import ExpandIcon from '../icons/expand';
import MetaDataRow from './metadata-row';
import MetaDataValue from './metadata-value';
import MetaDataCode from './metadata-code';
import Toggle from '../toggle';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData,
} from '../../selectors/metadata';
import { toggleNodeClicked } from '../../actions/nodes';
import { toggleCode, togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import './styles/metadata.css';

/**
 * Shows node meta data
 */
const MetaData = ({
  visible = true,
  metadata,
  theme,
  visibleCode,
  onToggleCode,
  onToggleNodeSelected,
  onTogglePlotModal,
}) => {
  const [showCopied, setShowCopied] = useState(false);
  // Hide code panel when selected metadata changes
  useEffect(() => onToggleCode(false), [metadata, onToggleCode]);
  // Hide plot modal when selected metadata changes
  useEffect(() => onTogglePlotModal(false), [metadata, onTogglePlotModal]);
  const isTaskNode = metadata?.type === 'task';
  const isDataNode = metadata?.type === 'data';
  const isParametersNode = metadata?.type === 'parameters';
  const nodeTypeIcon = getShortType(metadata?.datasetType, metadata?.type);
  const hasPlot = Boolean(metadata?.plot);
  const hasTrackingData = Boolean(metadata?.trackingData);
  const hasCode = Boolean(metadata?.code);
  const isTranscoded = Boolean(metadata?.originalType);
  const showCodePanel = visible && visibleCode && hasCode;
  const showCodeSwitch = hasCode;
  let runCommand = metadata?.runCommand;
  if (!runCommand) {
    // provide a help text for user to know why the run command is not available for the task node
    runCommand = isTaskNode
      ? 'Please provide a name argument for this node in order to see a run command.'
      : null;
  }

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(runCommand);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const onCloseClick = () => {
    // Deselecting a node automatically hides MetaData panel
    onToggleNodeSelected(null);
  };

  const onExpandPlotClick = () => {
    onTogglePlotModal(true);
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
                  icon={nodeTypeIcon}
                />
                <h2
                  className="pipeline-metadata__title"
                  dangerouslySetInnerHTML={{ __html: metadata.name }}
                />
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
                <Toggle
                  id="code"
                  checked={visibleCode}
                  enabled={hasCode}
                  title="Show Code"
                  onChange={(event) => {
                    onToggleCode(event.target.checked);
                  }}
                />
              )}
            </div>
            <div className="pipeline-metadata__list">
              <dl className="pipeline-metadata__properties">
                <MetaDataRow label="Type:" value={metadata.type} />
                {!isTranscoded && (
                  <MetaDataRow
                    label="Dataset Type:"
                    visible={isDataNode}
                    kind="type"
                    value={metadata.datasetType}
                  />
                )}
                {isTranscoded && (
                  <>
                    <MetaDataRow
                      label="Original Type:"
                      visible={isDataNode}
                      kind="type"
                      value={metadata.originalType}
                    />
                    <MetaDataRow
                      label="Transcoded Types:"
                      visible={isDataNode}
                      kind="type"
                      value={metadata.transcodedTypes}
                    />
                  </>
                )}
                <MetaDataRow
                  label="File Path:"
                  kind="path"
                  value={metadata.filepath}
                />
                {hasTrackingData && (
                  <MetaDataRow
                    label="Tracking data from last run:"
                    theme={theme}
                    visible={isDataNode}
                    kind="trackingData"
                    commas={false}
                    inline={false}
                    value={metadata.trackingData}
                  />
                )}
                <MetaDataRow
                  label="Parameters:"
                  theme={theme}
                  visible={isParametersNode || isTaskNode}
                  kind="parameters"
                  commas={false}
                  inline={false}
                  value={metadata.parameters}
                  limit={10}
                />
                <MetaDataRow
                  label="Inputs:"
                  visible={isTaskNode}
                  value={metadata.inputs}
                />
                <MetaDataRow
                  label="Outputs:"
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
                <MetaDataRow label="Run Command:" visible={Boolean(runCommand)}>
                  <div className="pipeline-metadata__toolbox-container">
                    <MetaDataValue
                      container={'code'}
                      className={modifiers(
                        'pipeline-metadata__run-command-value',
                        {
                          visible: !showCopied,
                        }
                      )}
                      value={runCommand}
                    />
                    {window.navigator.clipboard && metadata.runCommand && (
                      <>
                        <span
                          className={modifiers(
                            'pipeline-metadata__copy-message',
                            {
                              visible: showCopied,
                            }
                          )}
                        >
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
              </dl>
              {hasPlot && (
                <>
                  <div
                    className="pipeline-metadata__plot"
                    onClick={onExpandPlotClick}
                  >
                    <PlotlyChart
                      data={metadata.plot.data}
                      layout={metadata.plot.layout}
                      view="preview"
                    />
                  </div>
                  <button
                    className="pipeline-metadata__expand-plot"
                    onClick={onExpandPlotClick}
                  >
                    <ExpandIcon className="pipeline-metadata__expand-plot-icon"></ExpandIcon>
                    <span className="pipeline-metadata__expand-plot-text">
                      Expand Plotly Visualization
                    </span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  visible: getVisibleMetaSidebar(state),
  metadata: getClickedNodeMetaData(state),
  theme: state.theme,
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
  onTogglePlotModal: (visible) => {
    dispatch(togglePlotModal(visible));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetaData);
