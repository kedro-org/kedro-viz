import React from 'react';
import { connect } from 'react-redux';
import Modal from '../ui/modal';
import Button from '../ui/button';
import { toggleExportModal } from '../../actions';
import exportGraph from './export-graph';
import './export-modal.scss';

/**
 * Modal to allow users to choose between SVG/PNG export formats
 */
const ExportModal = ({ graphSize, theme, onToggle, visible }) => {
  return (
    <Modal
      closeModal={() => onToggle(false)}
      title="Export pipeline visualisation"
      visible={visible.exportModal}
    >
      <div className="pipeline-export-modal">
        <Button
          dataTest={'export-modal-download-png-btn'}
          onClick={() => {
            exportGraph({ format: 'png', theme, graphSize });
            onToggle(false);
          }}
        >
          Download PNG
        </Button>
        <Button
          dataTest={'export-modal-download-svg-btn'}
          onClick={() => {
            exportGraph({ format: 'svg', theme, graphSize });
            onToggle(false);
          }}
        >
          Download SVG
        </Button>
      </div>
    </Modal>
  );
};

export const mapStateToProps = (state) => ({
  graphSize: state.graph.size || {},
  visible: state.visible,
  theme: state.theme,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(toggleExportModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ExportModal);
