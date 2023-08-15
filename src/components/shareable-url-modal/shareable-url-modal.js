import React, { useState } from 'react';
import { connect } from 'react-redux';
import { toggleShareableUrlModal } from '../../actions';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import Button from '../ui/button';
import Input from '../ui/input';
import Modal from '../ui/modal';

import './shareable-url-modal.css';

const ShareableUrlModal = ({ onToggle, visible }) => {
  const [inputValues, setInputValues] = useState({});
  const [hasNotInteracted, setHasNotInteracted] = useState(true);

  const onChange = (key, value) => {
    setHasNotInteracted(false);
    setInputValues(
      Object.assign({}, inputValues, {
        [key]: value,
      })
    );
  };

  const handleFileUpload = async (file) => {
    const s3Client = new S3Client({
      region: inputValues.awsRegion,
      credentials: {
        accessKeyId: inputValues.accessKey,
        secretAccessKey: inputValues.secretAccessKey,
      },
    });

    try {
      const params = {
        Bucket: inputValues.bucketName,
        Key: file.name,
        Body: file,
      };

      await s3Client.send(new PutObjectCommand(params));
      console.log('File uploaded successfully.');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleFileInput = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  return (
    <Modal
      className="shareable-url-modal"
      closeModal={() => onToggle(false)}
      message="Please enter your AWS credentials and a hosted link will be generated."
      title="Deploy and Share"
      visible={visible.shareableUrlModal}
    >
      <div className="shareable-url-modal__input-wrapper">
        <div className="shareable-url-modal__input-label">AWS Region</div>
        <Input
          onChange={(value) => onChange('awsRegion', value)}
          placeholder="Enter details"
          resetValueTrigger={visible}
          size="large"
        />
      </div>
      <div className="shareable-url-modal__input-wrapper">
        <div className="shareable-url-modal__input-label">Bucket Name</div>
        <Input
          onChange={(value) => onChange('bucketName', value)}
          placeholder="Enter details"
          resetValueTrigger={visible}
          size="large"
        />
      </div>
      <div className="shareable-url-modal__input-wrapper">
        <div className="shareable-url-modal__input-label">Access Key ID</div>
        <Input
          onChange={(value) => onChange('accessKey', value)}
          placeholder="Enter details"
          resetValueTrigger={visible}
          size="large"
        />
      </div>
      <div className="shareable-url-modal__input-wrapper">
        <div className="shareable-url-modal__input-label">
          Secret Access Key
        </div>
        <Input
          onChange={(value) => onChange('secretAccessKey', value)}
          placeholder="Enter details"
          resetValueTrigger={visible}
          size="large"
        />
      </div>
      <div className="shareable-url-modal__button-wrapper">
        <Button mode="secondary" onClick={() => onToggle(false)} size="small">
          Cancel
        </Button>
        <input type="file" accept="*" onChange={handleFileInput} />
        <Button disabled={hasNotInteracted} size="small">
          Deploy
        </Button>
      </div>
    </Modal>
  );
};

export const mapStateToProps = (state) => ({
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(toggleShareableUrlModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ShareableUrlModal);
