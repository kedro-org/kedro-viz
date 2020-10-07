import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/icon-button';
import MetaDataRow from './metadata-row';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData
} from '../../selectors/metadata';
import './styles/metadata.css';

/**
 * Shows node meta data
 */
const MetaData = ({ visible, metadata }) => {
  const [runCommandText, setRunCommandText] = useState();
  const node = metadata ? metadata.node : null;

  if (!runCommandText && metadata) {
    setRunCommandText(metadata.runCommand);
  }

  const onCopyClick = () => {
    navigator.clipboard.writeText(metadata.runCommand);
    setRunCommandText('Copied to clipboard.');
    setTimeout(() => setRunCommandText(metadata.runCommand), 2500);
  };

  return (
    <div
      className={classnames('pipeline-metadata kedro', {
        'pipeline-metadata--visible': visible
      })}>
      {metadata && (
        <>
          <div className="pipeline-metadata__row">
            <h2 className="pipeline-metadata__title">
              <NodeIcon className="pipeline-metadata__icon" type={node.type} />
              {node.name}
            </h2>
          </div>
          <MetaDataRow label="Type:" kind="token">
            {node.type}
          </MetaDataRow>
          <MetaDataRow label="Inputs:" property="name">
            {metadata.inputs}
          </MetaDataRow>
          <MetaDataRow label="Outputs:" property="name">
            {metadata.outputs}
          </MetaDataRow>
          <MetaDataRow label="Tags:" kind="token" commas={false}>
            {metadata.tags}
          </MetaDataRow>
          <MetaDataRow label="Pipeline:">{metadata.pipeline}</MetaDataRow>
          <MetaDataRow label="Run Command:">
            <code className="pipeline-metadata__toolbox-container">
              <span className="pipeline-metadata__value pipeline-metadata__run-command-value pipeline-metadata__value--kind-token">
                {runCommandText}
              </span>
              <ul className="pipeline-metadata__toolbox">
                <IconButton icon="copy" onClick={onCopyClick} />
              </ul>
            </code>
          </MetaDataRow>
        </>
      )}
    </div>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  visible: getVisibleMetaSidebar(state),
  metadata: getClickedNodeMetaData(state),
  ...ownProps
});

export default connect(mapStateToProps)(MetaData);
