import React from 'react';
import { connect } from 'react-redux';
import BackIcon from '../icons/back';
import NodeIcon from '../icons/node-icon';
import PreviewRenderer from '../preview-renderer';
import { togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import { useNormalizedPreview } from '../../utils/hooks/use-normalized-preview';
import './metadata-modal.scss';

const MetadataModal = ({ metadata, onToggle, visible, theme }) => {
  const normalizedPreview = useNormalizedPreview(metadata, true);

  if (!visible.metadataModal || !normalizedPreview) {
    return null;
  }

  const nodeTypeIcon = getShortType(metadata?.datasetType, metadata?.type);

  const onCollapsePlotClick = () => {
    onToggle(false);
  };

  return (
    <div className="pipeline-metadata-modal">
      <div className="pipeline-metadata-modal__top">
        <button
          className="pipeline-metadata-modal__back"
          onClick={onCollapsePlotClick}
        >
          <BackIcon className="pipeline-metadata-modal__back-icon"></BackIcon>
          <span className="pipeline-metadata-modal__back-text">Back</span>
        </button>
        <div className="pipeline-metadata-modal__header">
          <NodeIcon
            className="pipeline-metadata-modal__icon"
            icon={nodeTypeIcon}
          />
          <span className="pipeline-metadata-modal__title">
            {metadata.name}
          </span>
        </div>
      </div>
      <PreviewRenderer
        normalizedPreview={normalizedPreview}
        view="modal"
        theme={theme}
      />
    </div>
  );
};

export const mapStateToProps = (state) => ({
  metadata: getClickedNodeMetaData(state),
  theme: state.theme,
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(togglePlotModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetadataModal);
