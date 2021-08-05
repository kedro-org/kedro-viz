import React from 'react';
import SettingsModal, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';
import { toggleSettingsModal } from '../../actions';

describe('SettingsModal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<SettingsModal />);
    expect(wrapper.find('.pipeline-settings-modal__content').length).toBe(1);
  });

  it('modal closes when X button is clicked', () => {
    const mount = () => {
      return setup.mount(<SettingsModal />, {
        afterLayoutActions: [() => toggleSettingsModal(true)],
      });
    };
    const wrapper = mount();
    expect(wrapper.find('.kui-modal__content--visible').length).toBe(1);
    const closeButton = wrapper.find('.kui-icon--close');
    closeButton.simulate('click');
    expect(wrapper.find('.kui-modal__content--visible').length).toBe(0);
  });

  it('maps state to props', () => {
    const expectedResult = {
      visible: expect.objectContaining({
        exportBtn: expect.any(Boolean),
        settingsBtn: expect.any(Boolean),
        exportModal: expect.any(Boolean),
        settingsModal: expect.any(Boolean),
      }),
      theme: expect.stringMatching(/light|dark/),
      flags: expect.any(Object),
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });

  it('maps dispatch to props', async () => {
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onClose(false);
    expect(dispatch.mock.calls[0][0]).toEqual({
      type: 'TOGGLE_SETTINGS_MODAL',
      visible: false,
    });

    mapDispatchToProps(dispatch).onToggleFlag('sizewarning', false);
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: 'CHANGE_FLAG',
      name: 'sizewarning',
      value: false,
    });
  });
});
