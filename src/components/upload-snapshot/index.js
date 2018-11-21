import React, { Component } from 'react';
import classnames from 'classnames';
import {
  Button,
  Input,
  Modal,
} from '@quantumblack/carbon-ui-components';
import config from '../../config';
import './upload-snapshot.css';

const storeKey = `${config.localStorageName}_token`;
const store = {
  get: () => window.localStorage.getItem(storeKey),
  set: token => window.localStorage.setItem(storeKey, token),
};

class UploadSnapshot extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: '',
      loading: false,
      modalVisible: false,
      showForm: true,
      status: '',
      token: store.get()
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
          schema: JSON.stringify(this.props.data.raw)
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
                      status={status && !token.length ? 'error' : null }
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
                      status={status && !message.length ? 'error' : null }
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

export default UploadSnapshot;
