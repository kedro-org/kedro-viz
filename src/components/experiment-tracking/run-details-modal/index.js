import React, { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_RUN_DETAILS } from '../../../apollo/mutations';
import { GET_RUN_METADATA } from '../../../apollo/queries';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import Input from '../../ui/input';

import '../../settings-modal/settings-modal.css';
import './run-details-modal.css';

const RunDetailsModal = ({ onClose, runMetadataToEdit, theme, visible }) => {
  const [valuesToUpdate, setValuesToUpdate] = useState({});
  const [updateRunDetails, { error }] = useMutation(UPDATE_RUN_DETAILS, {
    refetchQueries: [GET_RUN_METADATA],
  });

  const onApplyChanges = () => {
    updateRunDetails({
      variables: {
        runId: runMetadataToEdit.id,
        runInput: { notes: valuesToUpdate.notes, title: valuesToUpdate.title },
      },
    });
  };

  const onChange = (key, value) => {
    setValuesToUpdate(
      Object.assign({}, valuesToUpdate, {
        [key]: value,
      })
    );
  };

  useEffect(() => {
    setValuesToUpdate({
      notes: runMetadataToEdit?.notes,
      title: runMetadataToEdit?.title,
    });
  }, [runMetadataToEdit]);

  return (
    <div className="pipeline-settings-modal pipeline-settings-modal--experiment-tracking">
      <Modal
        onClose={() => onClose(false)}
        theme={theme}
        title="Edit run details"
        visible={visible}
      >
        <div className="pipeline-settings-modal__content pipeline-settings-modal__content--short">
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">Run name</div>
          </div>
          <Input
            defaultValue={runMetadataToEdit?.title}
            onChange={(value) => onChange('title', value)}
            size="large"
          />
        </div>
        <div className="pipeline-settings-modal__content pipeline-settings-modal__content--short">
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">
              Notes (this is searchable)
            </div>
          </div>
          <Input
            characterLimit={500}
            defaultValue={runMetadataToEdit?.notes || 'Add here'}
            onChange={(value) => onChange('notes', value)}
            size="small"
          />
        </div>
        <div className="run-details-modal-button-wrapper">
          <Button
            mode="secondary"
            onClick={() => onClose(false)}
            size="small"
            theme={theme}
          >
            Cancel
          </Button>
          <Button onClick={onApplyChanges} size="small" theme={theme}>
            Apply changes
          </Button>
        </div>
        {error ? (
          <div className="run-details-modal-error-wrapper">
            <p>Couldn't update run details. Please try again later.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default RunDetailsModal;
