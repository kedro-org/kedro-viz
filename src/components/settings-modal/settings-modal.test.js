import React from 'react';
import SettingsModal, { mapStateToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('SettingsModal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<SettingsModal />);
    expect(wrapper.find('.pipeline-settings-modal__content').length).toBe(1);
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
});
