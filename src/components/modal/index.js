import React from 'react';
import Modal from 'react-modal';
import goose from '../../static/images/chonky-goose.jpg';
import './modal.css';

/**
 * These are the style rules governing the modal
 */
const customStyles = {
  content: {
    top: '30%',
    left: '40%',
    right: 'auto',
    bottom: 'auto',
    color: '#FFFFFF',
    backgroundColor: '#001521',
    border: 'none'
  }
};

export const ChonkyModal = ({ nodesNo, edgesNo }) => {
  return (
    <div>
      <Modal
        isOpen={true}
        style={customStyles}
        contentLabel="Example Modal"
        // className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}>
        <div className="layout">
          <img src={goose} alt="goose" />
          <div>
            <div className="title">
              Woahhhhh!
              <br />
              Your pipeline is too chonky.
            </div>
            <div className="subtitle">
              Your pipeline contains <b>{nodesNo}</b> nodes and <b>{edgesNo}</b>{' '}
              edges.
              <br />
              Please use the filters on the left to select tags and elements for
              a <br />
              less chonky graph to display.
            </div>
            <button className="renderButton">Render it anyway</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChonkyModal;
