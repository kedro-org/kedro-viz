import React from 'react';
import RunDetailsModal from './index';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, shallow } from 'enzyme';

configure({ adapter: new Adapter() });

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

    onClick.mockImplementation((visible) => [visible, setVisible]);
    const closeButton = wrapper.find(
      '.pipeline-settings-modal--experiment-tracking .modal__close-button.pipeline-icon-toolbar__button'
    );
    closeButton.simulate('click');
    expect(
      wrapper.find(
        '.pipeline-settings-modal--experiment-tracking .kui-modal--visible'
      ).length
    ).toBe(0);
  });
});
