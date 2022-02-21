import React from 'react';
import UpdateReminder from './update-reminder';
import { mount } from 'enzyme';

describe('Update Reminder', () => {
  const versions = { latest: '4.3.1', installed: '4.2.0', isOutDated: true };

  const setDismiss = jest.fn();

  it('renders without crashing', () => {
    const wrapper = mount(<UpdateReminder versions={versions} />);
    expect(wrapper.find('.update-reminder-unexpanded').length).toBe(1);
  });

  it('popup expands when it is clicked', () => {
    const wrapper = mount(
      <UpdateReminder versions={versions} setDismiss={setDismiss} />
    );
    const container = wrapper.find('.update-reminder-unexpanded');

    container.find('.buttons-container').find('button').at(0).simulate('click');
    expect(wrapper.find('.update-reminder-expanded-header').length).toBe(1);
  });

  it('dismisses when the dismiss button is clicked', () => {
    const wrapper = mount(
      <UpdateReminder versions={versions} setDismiss={setDismiss} />
    );
    const container = wrapper.find('.update-reminder-unexpanded');
    container.find('.buttons-container').find('button').at(1).simulate('click');
    expect(wrapper.find('.update-reminder-expanded-header').length).toBe(0);
  });
});
