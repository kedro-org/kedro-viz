import React from 'react';
import { render } from '@testing-library/react';
import Modal from './index';
import '@testing-library/jest-dom';

describe('Modal', () => {
  const closeModal = jest.fn();

  it('renders without crashing', () => {
    const { container } = render(<Modal visible={true} />);
    const content = container.querySelector('.modal__content');
    expect(content).toBeInTheDocument();
  });

  it('should be a function', () => {
    expect(typeof Modal).toBe('function');
  });

  it('should have correct structure', () => {
    const { container } = render(
      <Modal title="Hello Test" closeModal={closeModal}>
        <div />
      </Modal>
    );
    expect(container.querySelector('.modal__bg')).toBeInTheDocument();
    expect(container.querySelector('.modal__wrapper')).toBeInTheDocument();
    expect(container.querySelector('.modal__content')).toBeInTheDocument();
  });

  it('should have button and description when supplied no children', () => {
    const { container } = render(
      <Modal
        closeModal={closeModal}
        message="This is a description."
        title="Hello Test"
      />
    );
    expect(container.querySelector('.modal__description')).toBeInTheDocument();
  });

  it('Modal should have correct structure when supplied children', () => {
    const { container } = render(
      <Modal title="Hello Test" closeModal={closeModal}>
        <button>Hello World</button>
      </Modal>
    );
    const wrapper = container.querySelector('.modal__wrapper');
    const button = wrapper?.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button?.textContent).toBe('Hello World');
  });
});
