import React from 'react';
import RunDetailsModal from './index';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, shallow } from 'enzyme';

configure({ adapter: new Adapter() });

// Mocked methods

const mockReset = jest.fn();
const mockUpdateRunDetails = jest.fn();

jest.mock('../../../apollo/mutations', () => {
  return {
    useUpdateRunDetails: () => {
      return {
        reset: mockReset,
        updateRunDetails: mockUpdateRunDetails,
      };
    },
  };
});

// Tests

describe('RunDetailsModal', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(<RunDetailsModal visible />);

    expect(
      wrapper.find('.pipeline-settings-modal--experiment-tracking').length
    ).toBe(1);
  });

  it('modal closes when X button is clicked', () => {
    const setVisible = jest.fn();
    const wrapper = mount(<RunDetailsModal onClose={() => setVisible(true)} />);
    const onClick = jest.spyOn(React, 'useState');
    const closeButton = wrapper.find(
      '.pipeline-settings-modal--experiment-tracking .modal__close-button.pipeline-icon-toolbar__button'
    );

    onClick.mockImplementation((visible) => [visible, setVisible]);

    closeButton.simulate('click');

    expect(
      wrapper.find(
        '.pipeline-settings-modal--experiment-tracking .kui-modal--visible'
      ).length
    ).toBe(0);
  });

  it('calls the updateRunDetails function', () => {
    const wrapper = mount(
      <RunDetailsModal runMetadataToEdit={{ id: 'test' }} visible={true} />
    );

    wrapper.find('.button__btn--primary').simulate('click');

    expect(mockUpdateRunDetails).toHaveBeenCalled();
  });
});
