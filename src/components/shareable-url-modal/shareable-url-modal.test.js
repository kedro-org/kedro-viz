import React from 'react';
import ShareableUrlModal from './shareable-url-modal';
import { setup } from '../../utils/state.mock';

describe('ShareableUrlModal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ShareableUrlModal />);
    wrapper.find('[data-test="disclaimerButton"]').simulate('click');
    expect(wrapper.find('.shareable-url-modal__input-wrapper').length).toBe(3);
  });
});
