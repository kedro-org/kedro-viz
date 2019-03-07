import React, { Component } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  Button,
  Input,
  Modal,
} from '@quantumblack/carbon-ui-components';
import { getActiveSchema } from '../../selectors';
import config from '../../config';
import './upload-snapshot.css';

const storeKey = `${config.localStorageName}_token`;
const store = {
  get: () => window.localStorage.getItem(storeKey),
  set: token => window.localStorage.setItem(storeKey, token),
};

/**
 * Upload button and form, to allow the current snapshot to be synced to Studio
 */
class UploadSnapshot extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: '',
      loading: false,
      modalVisible: false,
      showForm: true,
      status: '',
      token: store.get() || ''
    };

    this.syncStudioData = this.syncStudioData.bind(this);
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
  }

  syncStudioData() {
    const { message, token } = this.state;
    this.setState({ status: null, loading: true });

    fetch(config.syncEndpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          message,
          schema: this.props.json_schema
      })
    })
    .then((response) => {
      console.log(response);
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(() => {
      this.setState({
        loading: false,
        showForm: false,
        status: 'Your pipeline snapshot has been uploaded successfully!'
      });
      store.set(token);
    })
    .catch(status => {
      this.setState({
        loading: false,
        status: `⚠️ Upload failed: ${status}`
      });
    })
  }

  showModal() {
    this.setState({
      modalVisible: true
    });
  }

  hideModal() {
    this.setState({
      modalVisible: false,
      showForm: true,
      status: null
    });
  }

  validateForm() {
    const { message, token } = this.state;
    const isValid = message && token;
    if (!isValid) {
      this.setState({
        status: '⚠️ Please supply a value for both fields'
      });
    }
    return isValid;
  }

  render() {
    const { allowUploads, theme } = this.props;
    const {
      message,
      loading,
      modalVisible,
      showForm,
      status,
      token,
    } = this.state;

    if (!allowUploads) {
      return null;
    }

    /**
     * Set input status to 'error' (red underline) if status is set
     * and if the value is falsey (i.e. null/undefined/empty string)
     * @param {string} value Token or Message string
     * @return {string|null} Input status
     */
    const inputStatus = value => status && (!value ? 'error' : null);

    return (
      <div className="pipeline-upload">
        <Button theme={theme} onClick={this.showModal}>Upload Snapshot to StudioAI</Button>
        { modalVisible && (
          <Modal
            title='Upload pipeline snapshot to StudioAI'
            onClose={this.hideModal}
            visible={modalVisible}
            theme={theme}
            buttonLabel='Upload'>
            <form
              className={classnames('pipeline-upload__form', {
                'pipeline-upload__form--loading': loading
              })}
              onSubmit={event => {
                if (this.validateForm()) {
                  this.syncStudioData();
                }
                event.preventDefault();
              }}>
              <p>{ status }</p>
              { showForm && (
                <React.Fragment>
                  <div className="pipeline-form-row">
                    <Input
                      label='StudioAI token'
                      theme={theme}
                      value={token}
                      status={inputStatus(token)}
                      onChange={(e, { value }) => {
                        this.setState({ token: value });
                      }}
                      placeholder='e.g. qwertyuiop-1234-0987-asdfghjkl'
                      required />
                  </div>
                  <div className="pipeline-form-row">
                    <Input
                      label='Message'
                      theme={theme}
                      value={message}
                      status={inputStatus(message)}
                      onChange={(e, { value }) => {
                        this.setState({ message: value });
                      }}
                      placeholder='A description of your snapshot'
                      required />
                  </div>
                  <div className="pipeline-form-row">
                    <div className={classnames('pipeline-loading', {
                      'pipeline-loading--visible': loading
                    })} />
                    <Button>Upload</Button>
                  </div>
                </React.Fragment>
              )}
            </form>
          </Modal>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    json_schema: getActiveSchema(state),
    allowUploads: state.allowUploads,
    theme: state.theme
  };
};

export default connect(mapStateToProps, null)(UploadSnapshot);
