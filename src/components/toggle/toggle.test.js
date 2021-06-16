import React from 'react';
import Toggle from './index';
import { setup } from '../../utils/state.mock';

describe('Toggle', () => {
  const input = (wrapper) => wrapper.find('.pipeline-toggle-input');
  const label = (wrapper) => wrapper.find('.pipeline-toggle-label');

  it('is checked when checked is true', () => {
    const wrapper = setup.mount(
      <Toggle checked={true} onChange={jest.fn()}>
        {' '}
      </Toggle>
    );
    expect(input(wrapper).prop('checked')).toBe(true);
    expect(label(wrapper).hasClass('pipeline-toggle-label--checked')).toBe(
      true
    );
  });

  it('is not checked when checked is false', () => {
    const wrapper = setup.mount(
      <Toggle checked={false} onChange={jest.fn()}></Toggle>
    );
    expect(input(wrapper).prop('checked')).toBe(false);
    expect(label(wrapper).hasClass('pipeline-toggle-label--checked')).toBe(
      false
    );
  });
});
