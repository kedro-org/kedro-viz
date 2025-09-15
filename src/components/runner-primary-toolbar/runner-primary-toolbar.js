import { connect } from 'react-redux';
import PrimaryToolbar from '../primary-toolbar';
import IconButton from '../ui/icon-button';
import ExportIcon from '../icons/export';
import { toggleExportModal, toggleSidebar } from '../../actions';

/**
 * RunnerPrimaryToolbar
 * Minimal toolbar for Runner page: only sidebar toggle and export.
 */
export const RunnerPrimaryToolbar = ({
  onToggleSidebar,
  visible,
  onToggleExportModal,
}) => {
  return (
    <PrimaryToolbar
      onToggleSidebar={onToggleSidebar}
      visible={visible}
      // Ensure the menu button is shown (no filter button here)
      display={{ filterBtn: false }}
      dataTest={`sidebar-runner-visible-btn-${visible?.sidebar}`}
    >
      <IconButton
        ariaLabel="Export graph as SVG or PNG"
        className={'pipeline-menu-button--export'}
        dataTest={'sidebar-runner-export-btn'}
        icon={ExportIcon}
        labelText="Export visualisation"
        onClick={() => onToggleExportModal(true)}
        visible={true}
      />
    </PrimaryToolbar>
  );
};

const mapStateToProps = (state) => ({
  visible: state.visible,
});

const mapDispatchToProps = (dispatch) => ({
  onToggleExportModal: (value) => dispatch(toggleExportModal(value)),
  onToggleSidebar: (visible) => dispatch(toggleSidebar(visible)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RunnerPrimaryToolbar);
