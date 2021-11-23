import React from 'react';
import Modal from './index';
import { setup } from '../../utils/state.mock';

describe('Modal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<Modal visible={true} />);
    expect(wrapper.find('.modal__content').length).toBe(1);
  });
});
