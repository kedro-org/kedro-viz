import React, { useState, useCallback, useContext, useEffect } from 'react';
import { CSVLink } from 'react-csv';

import { constructExportData } from '../../../utils/experiment-tracking-utils';
import { ButtonTimeoutContext } from '../../../utils/button-timeout-context';

import Button from '../../ui/button';
import Modal from '../../ui/modal';

import './run-export-modal.css';

const RunExportModal = ({
  theme,
  visible,
  setShowRunExportModal,
  runMetadata,
  runTrackingData,
}) => {
  const [exportData, setExportData] = useState([]);
  const { isSuccessful, showModal, handleClick } =
    useContext(ButtonTimeoutContext);

  const updateExportData = useCallback(() => {
    setExportData(constructExportData(runMetadata, runTrackingData));
  }, [runMetadata, runTrackingData]);

  useEffect(() => {
    if (isSuccessful) {
      setShowRunExportModal(showModal);
    }
  }, [showModal, setShowRunExportModal, isSuccessful]);

  return (
    <div className="pipeline-run-export-modal pipeline-run-export-modal--experiment-tracking">
      <Modal
        closeModal={() => setShowRunExportModal(false)}
        theme={theme}
        title="Export experiment run"
        visible={visible}
      >
        <div className="run-export-modal-button-wrapper">
          <Button mode="secondary" onClick={() => setShowRunExportModal(false)}>
            Cancel
          </Button>
          <CSVLink
            data={exportData}
            asyncOnClick={true}
            onClick={updateExportData}
            filename="run-data.csv"
          >
            <Button
              onClick={handleClick}
              mode={isSuccessful ? 'success' : 'primary'}
            >
              {isSuccessful ? (
                <>
                  Done <span className="success-check-mark">✅</span>
                </>
              ) : (
                'Export all and close'
              )}
            </Button>
          </CSVLink>
        </div>
      </Modal>
    </div>
  );
};

export default RunExportModal;
