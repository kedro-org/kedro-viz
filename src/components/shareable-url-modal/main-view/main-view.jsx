/* eslint-disable camelcase */
import React from 'react';
import classnames from 'classnames';
import Dropdown from '../../ui/dropdown';
import Button from '../../ui/button';
import IconButton from '../../ui/icon-button';
import InfoIcon from '../../icons/info';
import Input from '../../ui/input';
import MenuOption from '../../ui/menu-option';
import Toggle from '../../ui/toggle';
import {
  hostingPlatforms,
  KEDRO_VIZ_PUBLISH_AWS_DOCS_URL,
  KEDRO_VIZ_PUBLISH_AZURE_DOCS_URL,
  KEDRO_VIZ_PUBLISH_GCP_DOCS_URL,
  KEDRO_VIZ_PUBLISH_DOCS_URL,
} from '../../../config';

const renderTextContent = (isPreviewEnabled, setIsPreviewEnabled) => {
  return (
    <div className="shareable-url-modal__content-wrapper">
      <div className="shareable-url-modal__content-title">
        Publish and Share Kedro-Viz
      </div>
      <h2 className="shareable-url-modal__content-description-title">
        Prerequisites{' '}
      </h2>
      <p className="shareable-url-modal__content-description">
        Deploying and hosting Kedro-Viz requires access keys or user
        credentials, depending on the chosen service provider. To use this
        feature, please add your access keys or credentials as environment
        variables in your project. More information can be found in the{' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={KEDRO_VIZ_PUBLISH_DOCS_URL}
        >
          documentation
        </a>
        .
      </p>
      <h2 className="shareable-url-modal__content-description-title shareable-url-modal__content-description-title--disclaimer">
        Disclaimer{' '}
      </h2>
      <p className="shareable-url-modal__content-description">
        Kedro-Viz contains preview data for multiple datasets. You can enable or
        disable all previews when publishing Kedro-Viz.
      </p>
      <div className="shareable-url-modal__content-preview-dataset">
        All dataset previews
        <Toggle
          className="shareable-url-modal__content-toggle"
          dataTest={`shareable-url-modal-preview-dataset-${isPreviewEnabled}`}
          title={isPreviewEnabled ? 'On' : 'Off'}
          checked={isPreviewEnabled}
          onChange={() => setIsPreviewEnabled((prev) => !prev)}
        />
      </div>
    </div>
  );
};

const MainView = ({
  handleModalClose,
  handleSubmit,
  inputValues,
  isFormDirty,
  onPlatformChange,
  onBuckNameChange,
  onEndpointChange,
  setIsPreviewEnabled,
  isPreviewEnabled,
  visible,
}) => {
  const { platform, bucket_name, endpoint } = inputValues || {};

  return (
    <>
      <div className="shareable-url-modal__content-form-wrapper">
        {renderTextContent(isPreviewEnabled, setIsPreviewEnabled)}
        <div className="shareable-url-modal__form-wrapper">
          <p className="shareable-url-modal__form-wrapper-title">
            Please enter the required information below.
          </p>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">
              Hosting platform
            </div>
            <Dropdown
              defaultText={platform && hostingPlatforms[platform]}
              placeholderText={!platform ? 'Select a hosting platform' : null}
              onChanged={onPlatformChange}
              dataTest={'shareable-url-modal-dropdown-hosting-platform'}
              width={null}
            >
              {Object.entries(hostingPlatforms).map(([value, label]) => (
                <MenuOption
                  className={classnames({
                    'pipeline-list__option--active': platform === value,
                  })}
                  key={value}
                  primaryText={label}
                  value={value}
                />
              ))}
            </Dropdown>
          </div>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">Bucket name</div>
            <Input
              defaultValue={bucket_name}
              onChange={onBuckNameChange}
              placeholder="Enter name"
              resetValueTrigger={visible}
              size="small"
              type="input"
              dataTest={'shareable-url-modal-input-bucket-name'}
            />
          </div>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__endpoint-url-wrapper">
              <div className="shareable-url-modal__input-label">
                Endpoint URL
              </div>
              <IconButton
                ariaLabel="The endpoint URL information"
                className="shareable-url-modal__information-icon"
                labelText={
                  <p className="shareable-url-modal__information-text">
                    The endpoint URL is the link to where your Kedro-Viz will be
                    hosted. For information on obtaining the endpoint URL,
                    please refer to the documentation for{' '}
                    <a
                      className="shareable-url-modal__input-label-text"
                      href={KEDRO_VIZ_PUBLISH_AWS_DOCS_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      AWS
                    </a>
                    ,{' '}
                    <a
                      className="shareable-url-modal__input-label-text"
                      href={KEDRO_VIZ_PUBLISH_AZURE_DOCS_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Azure
                    </a>
                    ,{' '}
                    <a
                      className="shareable-url-modal__input-label-text"
                      href={KEDRO_VIZ_PUBLISH_GCP_DOCS_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      GCP
                    </a>
                  </p>
                }
                icon={InfoIcon}
              />
            </div>
            <Input
              defaultValue={endpoint}
              onChange={onEndpointChange}
              placeholder="Enter url"
              resetValueTrigger={visible}
              size="small"
              type="input"
              dataTest={'shareable-url-modal-input-endpoint'}
            />
          </div>
        </div>
      </div>
      <div className="shareable-url-modal__button-wrapper">
        <Button
          mode="secondary"
          onClick={handleModalClose}
          size="small"
          dataTest={'shareable-url-modal-cancel-btn'}
        >
          Cancel
        </Button>
        <Button
          disabled={!Object.values(isFormDirty).every((value) => value)}
          size="small"
          onClick={handleSubmit}
          dataTest={'shareable-url-modal-publish-publish-btn'}
        >
          Publish
        </Button>
      </div>
    </>
  );
};

export default MainView;
