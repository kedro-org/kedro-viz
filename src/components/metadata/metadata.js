import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import modifiers from '../../utils/modifiers';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/ui/icon-button';
import CommandCopier from '../ui/command-copier/command-copier';
import PlotlyChart from '../plotly-chart';
import CloseIcon from '../icons/close';
import ExpandIcon from '../icons/expand';
import MetaDataRow from './metadata-row';
import MetaDataCode from './metadata-code';
import Toggle from '../ui/toggle';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData,
} from '../../selectors/metadata';
import { toggleNodeClicked } from '../../actions/nodes';
import { toggleCode, togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';
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
  onToggleMetadataModal,
}) => {
  const { toFlowchartPage } = useGeneratePathname();
  // Hide code panel when selected metadata changes
  useEffect(() => onToggleCode(false), [metadata, onToggleCode]);
  // Hide plot modal when selected metadata changes
  useEffect(
    () => onToggleMetadataModal(false),
    [metadata, onToggleMetadataModal]
  );

  const isTaskNode = metadata?.type === 'task';
  const isDataNode = metadata?.type === 'data';
  const isParametersNode = metadata?.type === 'parameters';
  const nodeTypeIcon = getShortType(metadata?.datasetType, metadata?.type);
  const hasPlot = Boolean(metadata?.plot);
  const hasImage = Boolean(metadata?.image);
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

  // translates the naming for the different types of nodes
  const translateMetadataType = (metadataType) => {
    if (metadataType === 'task') {
      return 'node';
    } else if (metadataType === 'data') {
      return 'dataset';
    }

    return metadataType;
  };

  const onCloseClick = () => {
    // Deselecting a node automatically hides MetaData panel
    onToggleNodeSelected(null);
    // and reset the URL to '/'
    toFlowchartPage();
  };

  const onExpandPlotClick = () => {
    onToggleMetadataModal(true);
  };

  // Since we style the path right-to-left, remove the initial slash
  const removeInitialSlash = (string) => {
    return string?.replace(/^\//g, '');
  };

  const shortenDatasetType = (string) => {
    return string?.split('.').pop();
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
                <h2 className="pipeline-metadata__title">{metadata.name}</h2>
              </div>
              <IconButton
                ariaLabel="Close Metadata Panel"
                className={modifiers('pipeline-metadata__close-button', {
                  hasCode,
                })}
                container={React.Fragment}
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
                <MetaDataRow
                  label="Type:"
                  value={translateMetadataType(metadata.type)}
                />
                {!isTranscoded && (
                  <MetaDataRow
                    label="Dataset Type:"
                    visible={isDataNode}
                    kind="type"
                    title={metadata.datasetType}
                    value={shortenDatasetType(metadata.datasetType)}
                  />
                )}
                {isTranscoded && (
                  <>
                    <MetaDataRow
                      label="Original Type:"
                      visible={isDataNode}
                      value={metadata.originalType}
                    />
                    <MetaDataRow
                      label="Transcoded Types:"
                      visible={isDataNode}
                      value={metadata.transcodedTypes}
                    />
                  </>
                )}
                <MetaDataRow
                  label="File Path:"
                  kind="path"
                  value={removeInitialSlash(metadata.filepath)}
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
                {metadata.type === 'task' && (
                  <MetaDataRow
                    label="Tags:"
                    kind="token"
                    commas={false}
                    value={metadata.tags}
                  />
                )}
                <MetaDataRow label="Run Command:" visible={Boolean(runCommand)}>
                  <CommandCopier
                    command={runCommand}
                    isCommand={metadata?.runCommand}
                  />
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
              {hasImage && (
                <>
                  <div
                    className="pipeline-metadata__plot"
                    onClick={onExpandPlotClick}
                  >
                    <img
                      alt="Matplotlib rendering"
                      className="pipeline-metadata__plot-image"
                      src={`data:image/png;base64,${metadata.image}`}
                    />
                  </div>
                  <button
                    className="pipeline-metadata__expand-plot"
                    onClick={onExpandPlotClick}
                  >
                    <ExpandIcon className="pipeline-metadata__expand-plot-icon"></ExpandIcon>
                    <span className="pipeline-metadata__expand-plot-text">
                      Expand Matplotlib Image
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
  onToggleMetadataModal: (visible) => {
    dispatch(togglePlotModal(visible));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetaData);
