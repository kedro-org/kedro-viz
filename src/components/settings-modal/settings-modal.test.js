import React from 'react';
import SettingsModal, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('SettingsModal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<SettingsModal />);
    expect(wrapper.find('.pipeline-settings-modal__content').length).toBe(1);
  });

  it('modal closes when X button is clicked', () => {
    const wrapper = setup.mount(<SettingsModal />);
    wrapper.find('.kui-icon--close').simulate('click');

    expect(wrapper.find('.kui-modal--visible').length).toBe(0);
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

    mapDispatchToProps(dispatch).onToggle(false);
    expect(dispatch.mock.calls[0][0]).toEqual({
      type: 'TOGGLE_SETTINGS_MODAL',
      visible: false,
    });

    mapDispatchToProps(dispatch).onToggleFlag('newparams', false);
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: 'CHANGE_FLAG',
      name: 'newparams',
      value: false,
    });
  });
});
