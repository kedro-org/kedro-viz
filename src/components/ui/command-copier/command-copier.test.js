import React from 'react';
import CommandCopier from './command-copier';
import { mount } from 'enzyme';

describe('command copier', () => {
  const command = 'test command';

  it('shows the node command', () => {
    const wrapper = mount(<CommandCopier command={command} />);

    const row = wrapper.find('.pipeline-metadata__value');
    expect(row.text()).toEqual('test command');
  });

  it('copies command when button clicked', () => {
    window.navigator.clipboard = {
      writeText: jest.fn(),
    };

    const wrapper = mount(<CommandCopier command={command} />);

    const copyButton = wrapper.find('button.copy-button');

    copyButton.simulate('click');

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'test command'
    );
  });
});
