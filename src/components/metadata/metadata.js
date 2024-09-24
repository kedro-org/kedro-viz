import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import modifiers from '../../utils/modifiers';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/ui/icon-button';
import PreviewTable from '../../components/preview-table';
import JSONObject from '../../components/json-object';
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
import {
  useGeneratePathname,
  useGeneratePathnameForExperimentTracking,
} from '../../utils/hooks/use-generate-pathname';

import './styles/metadata.scss';
import MetaDataStats from './metadata-stats';
import { isRunningLocally } from '../../utils';

/**
 * Shows node meta data
 */
const MetaData = ({
  isPrettyName,
  metadata,
  onToggleCode,
  onToggleMetadataModal,
  onToggleNodeSelected,
  theme,
  visible = true,
  visibleCode,
  showDatasetPreviews,
}) => {
  const { toSelectedPipeline } = useGeneratePathname();
  const { toExperimentTrackingPath, toMetricsViewPath } =
    useGeneratePathnameForExperimentTracking();

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
  const hasPreview = showDatasetPreviews && metadata?.preview;
  const hasPlot = hasPreview && metadata?.previewType === 'PlotlyPreview';
  const hasImage = hasPreview && metadata?.previewType === 'ImagePreview';
  const hasTrackingData =
    hasPreview &&
    (metadata?.previewType === 'MetricsTrackingPreview' ||
      metadata?.previewType === 'JSONTrackingPreview');
  const hasTablePreview =
    hasPreview && metadata?.previewType === 'TablePreview';
  const isMetricsTrackingDataset =
    hasPreview && metadata?.previewType === 'MetricsTrackingPreview';
  const hasJSONPreview = hasPreview && metadata?.previewType === 'JSONPreview';
  const hasCode = Boolean(metadata?.code);
  const isTranscoded = Boolean(metadata?.originalType);
  const showCodePanel = visible && visibleCode && hasCode;
  const showCodeSwitch = hasCode;

  if (isMetricsTrackingDataset) {
    //rounding of tracking data
    Object.entries(metadata?.preview).forEach(([key, value]) => {
      if (typeof value === 'number') {
        metadata.preview[key] = Math.round(value * 100) / 100;
      }
    });
  }

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
    // and reset the URL to the current active pipeline
    toSelectedPipeline();
  };

  const onExpandMetaDataClick = () => {
    onToggleMetadataModal(true);
  };

  // Since we style the path right-to-left, remove the initial slash
  const removeInitialSlash = (string) => {
    return string?.replace(/^\//g, '');
  };

  const shortenDatasetType = (value) => {
    const isList = Array.isArray(value);

    return isList
      ? value.map((val) => val.split('.').pop())
      : value?.split('.').pop();
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
                  dataTest={`metadata-code-toggle-${visibleCode}`}
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
                {isPrettyName ? (
                  <MetaDataRow
                    label="Original node name:"
                    value={metadata.fullName}
                  />
                ) : (
                  <MetaDataRow
                    label="Pretty node name:"
                    value={metadata.prettyName}
                  />
                )}
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
                      value={shortenDatasetType(metadata.originalType)}
                    />
                    <MetaDataRow
                      label="Transcoded Types:"
                      visible={isDataNode}
                      value={shortenDatasetType(metadata.transcodedTypes)}
                    />
                  </>
                )}
                <MetaDataRow
                  label="File Path:"
                  kind="path"
                  empty="N/A"
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
                    value={metadata?.preview}
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
                    classNames={'pipeline-metadata__value'}
                    isCommand={metadata?.runCommand}
                    dataTest={'metadata-copy-command'}
                  />
                </MetaDataRow>
                {isDataNode && (
                  <>
                    <span
                      className="pipeline-metadata__label"
                      data-label="Dataset statistics:"
                    >
                      Dataset statistics:
                    </span>
                    <MetaDataStats stats={metadata?.stats}></MetaDataStats>
                  </>
                )}
              </dl>
              {hasPlot && (
                <>
                  <div
                    className="pipeline-metadata__plot"
                    onClick={onExpandMetaDataClick}
                  >
                    <PlotlyChart
                      data={metadata?.preview.data}
                      layout={metadata?.preview.layout}
                      view="preview"
                    />
                  </div>
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
                    </span>
                  </button>
                </>
              )}
              {hasImage && (
                <>
                  <div
                    className="pipeline-metadata__plot"
                    onClick={onExpandMetaDataClick}
                  >
                    <img
                      alt="Matplotlib rendering"
                      className="pipeline-metadata__plot-image"
                      src={`data:image/png;base64,${metadata?.preview}`}
                    />
                  </div>
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
                    </span>
                  </button>
                </>
              )}
              {isRunningLocally()
                ? hasTrackingData && (
                    <button
                      className="pipeline-metadata__link"
                      onClick={
                        isMetricsTrackingDataset
                          ? toMetricsViewPath
                          : toExperimentTrackingPath
                      }
                    >
                      <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                      <span className="pipeline-metadata__link-text">
                        Open in Experiment Tracking
                      </span>
                    </button>
                  )
                : null}
              {hasTablePreview && (
                <>
                  <div className="pipeline-metadata__preview">
                    <div className="scrollable-container">
                      <PreviewTable
                        data={metadata?.preview}
                        size="small"
                        onClick={onExpandMetaDataClick}
                      />
                    </div>
                    <div className="pipeline-metadata__preview-shadow-box-right" />
                    <div className="pipeline-metadata__preview-shadow-box-bottom" />
                  </div>
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
                    </span>
                  </button>
                </>
              )}
              {hasJSONPreview && (
                <>
                  <div className="pipeline-metadata__preview-json">
                    <div className="scrollable-container">
                      <JSONObject
                        value={JSON.parse(metadata.preview)}
                        theme={theme}
                        style={{ background: 'transparent', fontSize: '14px' }}
                        collapsed={3}
                      />
                    </div>
                    <div className="pipeline-metadata__preview-shadow-box-right" />
                    <div className="pipeline-metadata__preview-shadow-box-bottom" />
                  </div>
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
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
  isPrettyName: state.isPrettyName,
  metadata: getClickedNodeMetaData(state),
  theme: state.theme,
  visible: getVisibleMetaSidebar(state),
  visibleCode: state.visible.code,
  showDatasetPreviews: state.showDatasetPreviews,
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
