import React from 'react';
import MetadataModal from './metadata-modal';
import { toggleNodeClicked, addNodeMetadata } from '../../actions/nodes';
import { togglePlotModal } from '../../actions';
import { setup, prepareState } from '../../utils/state.mock';
import nodePlot from '../../utils/data/node_plot.mock.json';
import spaceflights from '../../utils/data/spaceflights.mock.json';
import { fireEvent } from '@testing-library/react';
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

  it('modal closes when back button is clicked', () => {
    const { store, getByRole } = setup.render(<MetadataModal />, {
      state: prepareState({
        beforeLayoutActions: [
          () => toggleNodeClicked(nodeID),
          () => togglePlotModal(true),
          () => addNodeMetadata({ id: nodeID, data: nodePlot }),
        ],
        data: spaceflights,
      }),
    });

    expect(store.getState().visible.metadataModal).toBe(true);

    const backBtn = getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);

    expect(store.getState().visible.metadataModal).toBe(false);
  });

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
