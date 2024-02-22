import Button from '../ui/button';
import CopyIcon from '../icons/copy';
import IconButton from '../ui/icon-button';
import LoadingIcon from '../icons/loading';
import Tooltip from '../ui/tooltip';
import { KEDRO_VIZ_DOCS_URL, KEDRO_VIZ_PUBLISH_URL } from '../../config';

/**
 * Renders a compatibility message based on the availability of shareable URLs.
 * @param {boolean} canUseShareableUrls - Indicates whether shareable URLs can be used.
 * @param {function} handleModalClose - The function to handle the modal close event.
 * @returns {JSX.Element|null} - The rendered compatibility message or null if shareable URLs can be used.
 */
export const renderCompatibilityMessage = (
  canUseShareableUrls,
  handleModalClose
) => {
  return !canUseShareableUrls ? (
    <div className="shareable-url-modal__button-wrapper shareable-url-modal__button-wrapper--right">
      <Button mode="secondary" onClick={() => handleModalClose()} size="small">
        Cancel
      </Button>
      <a
        href="https://docs.kedro.org/en/latest/visualisation/share_kedro_viz.html"
        rel="noreferrer"
        target="_blank"
      >
        <Button size="small">View documentation</Button>
      </a>
    </div>
  ) : null;
};

/**
 * Renders the success content for the shareable URL modal.
 *
 * @param {string} responseUrl - The response URL.
 * @param {boolean} showCopied - Indicates whether the "Copied!" tooltip should be shown.
 * @param {function} onCopyClick - The function to be called when the copy button is clicked.
 * @param {function} handleResponseUrl - The function to handle the response URL.
 * @param {function} handleModalClose - The function to handle the modal close event.
 * @param {function} handleLinkSettingsClick - The function to handle the link settings click event.
 * @returns {JSX.Element|null} The rendered success content.
 */
export const renderSuccessContent = (
  responseUrl,
  showCopied,
  onCopyClick,
  handleResponseUrl,
  handleModalClose,
  handleLinkSettingsClick
) => {
  return responseUrl ? (
    <>
      <div className="shareable-url-modal__result">
        <div className="shareable-url-modal__label">Hosted link</div>
        <div className="shareable-url-modal__url-wrapper">
          <a
            className="shareable-url-modal__result-url"
            href={handleResponseUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {responseUrl}
          </a>
          {window.navigator.clipboard && (
            <div className="shareable-url-modal__result-action">
              <IconButton
                ariaLabel="Copy run command to clipboard."
                className="copy-button"
                dataHeapEvent={`clicked.run_command`}
                icon={CopyIcon}
                onClick={onCopyClick}
              />
              <Tooltip
                text="Copied!"
                visible={showCopied}
                noDelay
                centerArrow
                arrowSize="small"
              />
            </div>
          )}
        </div>
      </div>
      <div className="shareable-url-modal__button-wrapper ">
        <Button
          mode="secondary"
          onClick={() => handleLinkSettingsClick()}
          size="small"
        >
          Link Settings
        </Button>
        <Button
          mode="secondary"
          onClick={() => handleModalClose()}
          size="small"
        >
          Close
        </Button>
      </div>
    </>
  ) : null;
};

/**
 * Renders the error content for the shareable URL modal.
 *
 * @param {string} responseError - The error message to display.
 * @param {function} handleGoBackClick - The function to handle the "Go back" button click.
 * @returns {JSX.Element|null} The rendered error content or null if there is no error.
 */
export const renderErrorContent = (responseError, handleGoBackClick) => {
  return responseError ? (
    <div className="shareable-url-modal__error">
      <p>Error message: {responseError}</p>
      <Button mode="primary" onClick={() => handleGoBackClick()} size="small">
        Go back
      </Button>
    </div>
  ) : null;
};

/**
 * Renders the disclaimer content for the shareable URL modal.
 *
 * @param {Function} clearDisclaimerMessage - The function to clear the disclaimer message.
 * @param {Function} handleModalClose - The function to handle the modal close event.
 * @returns {JSX.Element} The JSX element representing the disclaimer content.
 */
export const renderDisclaimerContent = (
  clearDisclaimerMessage,
  handleModalClose
) => {
  return (
    <div>
      <div className="shareable-url-modal__content-wrapper shareable-url-modal__content-description">
        Disclaimer: Please note that Kedro-Viz contains preview data for
        multiple datasets. If you wish to disable the preview when publishing
        Kedro-Viz, please refer to the documentation on how to do so.
      </div>
      <div className="shareable-url-modal__button-wrapper shareable-url-modal__button-wrapper--right">
        <Button
          mode="secondary"
          onClick={() => handleModalClose()}
          size="small"
        >
          Cancel
        </Button>
        <Button
          dataTest="disclaimerButton"
          size="small"
          onClick={clearDisclaimerMessage}
        >
          Okay
        </Button>
      </div>
    </div>
  );
};

/**
 * Renders the loading content based on the isLoading flag.
 *
 * @param {boolean} isLoading - Flag indicating whether the content is loading or not.
 * @returns {JSX.Element|null} - The loading content or null if isLoading is false.
 */
export const renderLoadingContent = (isLoading) => {
  return isLoading ? (
    <div className="shareable-url-modal__loading">
      <LoadingIcon visible={isLoading} />
    </div>
  ) : null;
};

/**
 * Renders the text content for the shareable URL modal.
 * @returns {JSX.Element} The rendered JSX element.
 */
export const renderTextContent = () => {
  return (
    <div className="shareable-url-modal__content-wrapper">
      <div className="shareable-url-modal__content-title">
        Publish and Share Kedro-Viz
      </div>
      <p className="shareable-url-modal__content-description shareable-url-modal__paregraph-divider">
        Prerequisite: Deploying and hosting Kedro-Viz requires access keys or
        user credentials, depending on the chosen cloud provider. To use this
        feature, please add your access keys or credentials as environment
        variables in your Kedro project. More information can be found in{' '}
        <a target="_blank" rel="noopener noreferrer" href={KEDRO_VIZ_DOCS_URL}>
          docs
        </a>
        .
      </p>
      <p className="shareable-url-modal__content-description">
        Enter the required information and a hosted link will be generated.
      </p>
      <p className="shareable-url-modal__content-description shareable-url-modal__content-note">
        For more information on obtaining the Endpoint URL, refer to{' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={KEDRO_VIZ_PUBLISH_URL}
        >
          the documentation
        </a>
        .
      </p>
    </div>
  );
};
