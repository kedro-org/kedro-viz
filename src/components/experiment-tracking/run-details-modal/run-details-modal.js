import React, { useEffect, useState, useContext } from 'react';
import { connect } from 'react-redux';
import { updateRunTitle, updateRunNotes } from '../../../actions';

import { ButtonTimeoutContext } from '../../../utils/button-timeout-context';

import Button from '../../ui/button';
import Modal from '../../ui/modal';
import Input from '../../ui/input';

import '../../settings-modal/settings-modal.scss';
import './run-details-modal.scss';

const RunDetailsModal = ({
  runMetadataToEdit,
  setShowRunDetailsModal,
  theme,
  visible,
  runsMetadata,
  onUpdateRunTitle,
  onUpdateRunNotes,
}) => {
  const [valuesToUpdate, setValuesToUpdate] = useState({});
  const {
    handleClick,
    hasNotInteracted,
    isSuccessful,
    setHasNotInteracted,
    setIsSuccessful,
    showModal,
  } = useContext(ButtonTimeoutContext);

  const onApplyChanges = () => {
    onUpdateRunTitle(valuesToUpdate.title, runMetadataToEdit.id);
    onUpdateRunNotes(valuesToUpdate.notes, runMetadataToEdit.id);

    handleClick();
    setIsSuccessful(true);
  };

  const onChange = (key, value) => {
    setValuesToUpdate(
      Object.assign({}, valuesToUpdate, {
        [key]: value,
      })
    );
    setHasNotInteracted(false);
  };

  const onCloseModal = () => {
    if (runMetadataToEdit?.id) {
      const { notes = '', title = runMetadataToEdit.id } =
        runsMetadata[runMetadataToEdit.id] || {};
      setValuesToUpdate({ notes, title });
    }
    setShowRunDetailsModal(false);
  };

  // only if the component is visible first, then apply isSuccessful to show or hide modal
  useEffect(() => {
    if (visible && isSuccessful) {
      setShowRunDetailsModal(showModal);
    }
  }, [showModal, setShowRunDetailsModal, isSuccessful, visible]);

  useEffect(() => {
    if (runMetadataToEdit?.id) {
      const { notes = '', title = runMetadataToEdit.id } =
        runsMetadata[runMetadataToEdit.id] || {};
      setValuesToUpdate({ notes, title });
    }
  }, [runMetadataToEdit, runsMetadata]);

  return (
    <div className="pipeline-settings-modal pipeline-settings-modal--experiment-tracking">
      <Modal
        closeModal={onCloseModal}
        theme={theme}
        title="Edit run details"
        visible={visible}
      >
        <div className="pipeline-settings-modal__content pipeline-settings-modal__content--short">
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">Run name</div>
          </div>
          <Input
            defaultValue={valuesToUpdate.title}
            onChange={(value) => onChange('title', value)}
            resetValueTrigger={visible}
            type="textarea"
            size="large"
          />
        </div>
        <div className="pipeline-settings-modal__content pipeline-settings-modal__content--short">
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">Notes</div>
          </div>
          <Input
            characterLimit={500}
            defaultValue={valuesToUpdate.notes || ''}
            onChange={(value) => onChange('notes', value)}
            placeholder="Add here"
            resetValueTrigger={visible}
            type="textarea"
            size="small"
          />
        </div>
        <div className="run-details-modal-button-wrapper">
          <Button mode="secondary" onClick={onCloseModal} size="small">
            Cancel
          </Button>
          <Button
            dataTest={'run-details-modal-apply-changes'}
            disabled={hasNotInteracted}
            onClick={onApplyChanges}
            mode={isSuccessful ? 'success' : 'primary'}
            size="small"
          >
            {isSuccessful ? (
              <>
                Changes applied <span className="success-check-mark">✅</span>
              </>
            ) : (
              'Apply changes and close'
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  runsMetadata: state.runsMetadata,
});

export const mapDispatchToProps = (dispatch) => ({
  onUpdateRunTitle: (title, runId) => {
    dispatch(updateRunTitle(title, runId));
  },
  onUpdateRunNotes: (notes, runId) => {
    dispatch(updateRunNotes(notes, runId));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RunDetailsModal);
