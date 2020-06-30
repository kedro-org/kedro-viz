import React from 'react';
import ExportModal, { mapStateToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('ExportModal', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ExportModal />);
    expect(wrapper.find('.pipeline-icon-modal').length).toBe(1);
  });

  it('maps state to props', () => {
    const expectedResult = {
      graphSize: expect.objectContaining({
        height: expect.any(Number),
        width: expect.any(Number),
        marginx: expect.any(Number),
        marginy: expect.any(Number)
      }),
      theme: expect.stringMatching(/light|dark/),
      visible: expect.objectContaining({
        exportBtn: expect.any(Boolean),
        exportModal: expect.any(Boolean),
        labelBtn: expect.any(Boolean),
        layerBtn: expect.any(Boolean),
        layers: expect.any(Boolean),
        themeBtn: expect.any(Boolean),
        sidebar: expect.any(Boolean)
      })
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });
});
