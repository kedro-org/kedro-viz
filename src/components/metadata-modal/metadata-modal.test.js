import React from 'react';
import MetadataModal from './metadata-modal';
import { toggleNodeClicked, addNodeMetadata } from '../../actions/nodes';
import { togglePlotModal } from '../../actions';
import { setup, prepareState } from '../../utils/state.mock';
import nodePlot from '../../utils/data/node_plot.mock.json';
import spaceflights from '../../utils/data/spaceflights.mock.json';

const nodeID = '966b9734';

describe('Plotly Modal', () => {
  const renderWithState = () =>
    setup.render(<MetadataModal />, {
      state: prepareState({
        beforeLayoutActions: [
          () => toggleNodeClicked(nodeID),
          () => togglePlotModal(true),
          () => addNodeMetadata({ id: nodeID, data: nodePlot }),
        ],
        data: spaceflights,
      }),
    });

  it('renders without crashing', () => {
    const { container } = renderWithState();
    expect(
      container.querySelector('.pipeline-metadata-modal')
    ).toBeInTheDocument();
  });

  //TODO: FIX TEST
  // it('modal closes when back button is clicked', async () => {
  //   const { container, store } = renderWithState();
  //   const backBtn = container.querySelector('.pipeline-metadata-modal__back');
  //   expect(backBtn).toBeInTheDocument();
  //   backBtn.click();
  //   store.dispatch(togglePlotModal(false));
  //   await waitFor(() => {
  //     expect(container.querySelector('.pipeline-metadata-modal')).not.toBeInTheDocument();
  //   });
  // });

  it('shows plot when a plot node is clicked', () => {
    const { container } = renderWithState();
    expect(
      container.querySelector('.pipeline-metadata-modal__header')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.pipeline-plotly-chart')
    ).toBeInTheDocument();
  });
});
