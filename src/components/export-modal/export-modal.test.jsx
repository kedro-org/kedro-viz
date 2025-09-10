import React from 'react';
import ExportModal, { mapStateToProps } from './export-modal';
import { mockState, setup, prepareState } from '../../utils/state.mock';
import { toggleExportModal } from '../../actions';
import spaceflights from '../../utils/data/spaceflights.mock.json';

describe('ExportModal', () => {
  it('renders without crashing', () => {
    setup.render(<ExportModal />);
    expect(
      document.querySelector('.pipeline-export-modal')
    ).toBeInTheDocument();
  });

  it('modal shows when visible is true (afterLayoutAction)', () => {
    const state = prepareState({
      data: spaceflights,
      afterLayoutActions: [() => toggleExportModal(true)],
    });
    const { container } = setup.render(<ExportModal />, {
      state,
    });
    expect(
      container.querySelector('.modal__content--visible')
    ).toBeInTheDocument();
  });

  it('maps state to props', () => {
    const result = mapStateToProps(mockState.spaceflights);
    expect(result).toEqual({
      graphSize: expect.objectContaining({
        height: expect.any(Number),
        width: expect.any(Number),
        marginx: expect.any(Number),
        marginy: expect.any(Number),
      }),
      theme: expect.stringMatching(/light|dark/),
      visible: expect.objectContaining({
        exportModal: expect.any(Boolean),
        settingsModal: expect.any(Boolean),
      }),
    });
  });
});
