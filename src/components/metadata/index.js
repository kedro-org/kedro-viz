import React, { useState } from 'react';
import { connect } from 'react-redux';
import modifiers from '../../utils/modifiers';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/icon-button';
import CopyIcon from '../icons/copy';
import MetaDataRow from './metadata-row';
import MetaDataValue from './metadata-value';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData
} from '../../selectors/metadata';
import './styles/metadata.css';

/**
 * Shows node meta data
 */
const MetaData = ({ visible = true, metadata }) => {
  const [showCopied, setShowCopied] = useState(false);

  const isTaskNode = metadata?.node.type === 'task';

  const runCommandText = !showCopied
    ? metadata?.runCommand
    : 'Copied to clipboard.';

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(metadata.runCommand);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };

  if (!metadata) {
    return <div className="pipeline-metadata kedro" />;
  }

  return (
    <div className={modifiers('pipeline-metadata', { visible }, 'kedro')}>
      <div className="pipeline-metadata__row">
        <h2 className="pipeline-metadata__title">
          <NodeIcon
            className="pipeline-metadata__icon"
            type={metadata.node.type}
          />
          {metadata.node.name}
        </h2>
      </div>
      <MetaDataRow label="Type:">{metadata.node.type}</MetaDataRow>
      <MetaDataRow label="Inputs:" property="name" visible={isTaskNode}>
        {metadata.inputs}
      </MetaDataRow>
      <MetaDataRow label="Outputs:" property="name" visible={isTaskNode}>
        {metadata.outputs}
      </MetaDataRow>
      <MetaDataRow label="Tags:" kind="token" commas={false}>
        {metadata.tags}
      </MetaDataRow>
      <MetaDataRow label="Pipeline:">{metadata.pipeline}</MetaDataRow>
      <MetaDataRow label="Run Command:" visible={Boolean(runCommandText)}>
        <code className="pipeline-metadata__toolbox-container">
          <MetaDataValue
            className="pipeline-metadata__run-command-value"
            value={runCommandText}
          />
          {window.navigator.clipboard && (
            <ul className="pipeline-metadata__toolbox">
              <IconButton
                ariaLabel="Copy run command to clipboard."
                className="pipeline-metadata__copy-button"
                icon={CopyIcon}
                onClick={onCopyClick}
              />
            </ul>
          )}
        </code>
      </MetaDataRow>
    </div>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  visible: getVisibleMetaSidebar(state),
  metadata: getClickedNodeMetaData(state),
  ...ownProps
});

export default connect(mapStateToProps)(MetaData);
