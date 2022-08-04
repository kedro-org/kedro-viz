import React, { useState, useCallback, useContext, useEffect } from 'react';
import { CSVLink } from 'react-csv';

import { constructExportData } from '../../../utils/experiment-tracking-utils';
import { ButtonTimeoutContext } from '../../../utils/button-timeout-context';

import Button from '../../ui/button';
import Modal from '../../ui/modal';

import './run-export-modal.css';

const RunExportModal = ({
  runMetadata,
  runTrackingData,
  setShowRunExportModal,
  theme,
  visible,
}) => {
  const [exportData, setExportData] = useState([]);
  const { isSuccessful, showModal, handleClick } =
    useContext(ButtonTimeoutContext);

  const updateExportData = useCallback(() => {
    setExportData(constructExportData(runMetadata, runTrackingData));
  }, [runMetadata, runTrackingData]);

  // only if the component is visible first, then apply isSuccessful to show or hide modal
  useEffect(() => {
    if (visible && isSuccessful) {
      setShowRunExportModal(showModal);
    }
  }, [showModal, setShowRunExportModal, isSuccessful, visible]);

  return (
    <div className="pipeline-run-export-modal pipeline-run-export-modal--experiment-tracking">
      <Modal
        closeModal={() => setShowRunExportModal(false)}
        theme={theme}
        title="Export experiment run"
        visible={visible}
      >
        <div className="run-export-modal-button-wrapper">
          <Button
            mode="secondary"
            onClick={() => setShowRunExportModal(false)}
            size="small"
          >
            Cancel
          </Button>
          <CSVLink
            asyncOnClick={true}
            data={exportData}
            filename="run-data.csv"
            onClick={updateExportData}
          >
            <Button
              mode={isSuccessful ? 'success' : 'primary'}
              onClick={handleClick}
              size="small"
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
