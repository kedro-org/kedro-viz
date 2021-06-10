import React from 'react';
import SettingsToggle from './settings-toggle';
import { setup } from '../../utils/state.mock';

describe('SettingsToggle', () => {
  const input = (wrapper) =>
    wrapper.find('.pipeline-settings-modal-toggle-input');
  const label = (wrapper) =>
    wrapper.find('.pipeline-settings-modal-toggle-label');

  it('is checked when checked is true', () => {
    const wrapper = setup.mount(
      <SettingsToggle checked={true} onChange={jest.fn()}>
        {' '}
      </SettingsToggle>
    );
    expect(input(wrapper).prop('checked')).toBe(true);
    expect(
      label(wrapper).hasClass('pipeline-settings-modal-toggle-label--checked')
    ).toBe(true);
  });

  it('is not checked when checked is false', () => {
    const wrapper = setup.mount(
      <SettingsToggle checked={false} onChange={jest.fn()}></SettingsToggle>
    );
    expect(input(wrapper).prop('checked')).toBe(false);
    expect(
      label(wrapper).hasClass('pipeline-settings-modal-toggle-label--checked')
    ).toBe(false);
  });
});
