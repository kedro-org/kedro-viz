import React from 'react';
import RunDetailsModal from './index';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure } from 'enzyme';
import { waitFor } from '@testing-library/react';
import { ButtonTimeoutContext } from '../../../utils/button-timeout-context';
import { setup } from '../../../utils/state.mock';

configure({ adapter: new Adapter() });

const mockValue = {
  handleClick: jest.fn(),
  hasNotInteracted: true,
  isSuccessful: false,
  setHasNotInteracted: jest.fn(),
  setIsSuccessful: jest.fn(),
  showModal: false,
};

// Tests

describe('RunDetailsModal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(
      <ButtonTimeoutContext.Provider value={mockValue}>
        <RunDetailsModal visible />
      </ButtonTimeoutContext.Provider>
    );

    expect(
      wrapper.find('.pipeline-settings-modal--experiment-tracking').length
    ).toBe(1);
  });

  it('renders with a disabled primary button', () => {
    const wrapper = setup.mount(
      <ButtonTimeoutContext.Provider value={mockValue}>
        <RunDetailsModal visible />
      </ButtonTimeoutContext.Provider>
    );

    const primaryButton = wrapper
      .render()
      .find(
        '.pipeline-settings-modal--experiment-tracking .button__btn.button__btn--primary'
      );

    waitFor(() => expect(primaryButton).toBeDisabled());
  });

  it('modal closes when cancel button is clicked', () => {
    const setVisible = jest.fn();
    const wrapper = setup.mount(
      <ButtonTimeoutContext.Provider value={mockValue}>
        <RunDetailsModal setShowRunDetailsModal={() => setVisible(true)} />
      </ButtonTimeoutContext.Provider>
    );
    const onClick = jest.spyOn(React, 'useState');
    const closeButton = wrapper.find(
      '.pipeline-settings-modal--experiment-tracking .button__btn.button__btn--secondary'
    );

    onClick.mockImplementation((visible) => [visible, setVisible]);

    closeButton.simulate('click');

    expect(
      wrapper.find(
        '.pipeline-settings-modal--experiment-tracking .kui-modal--visible'
      ).length
    ).toBe(0);
  });
});
