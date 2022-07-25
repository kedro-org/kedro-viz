import React from 'react';
import RunPlotsModal from './run-plots-modal';
import { setup } from '../../../utils/state.mock';

const runDatasetToShow = {
  datasetKey: 'matplot_lib_single_plot.png',
  datasetType:
    'kedro.extras.datasets.matplotlib.matplotlib_writer.MatplotlibWriter',
  updatedDatasetValues: [
    { runId: '2022-07-21T12.54.06.759Z', value: 'iVBORw0KGgoAA' },
  ],
};

describe('Run Plots Modal', () => {
  const setShowRunPlotsModal = jest.fn();

  const mount = () => {
    return setup.mount(
      <RunPlotsModal
        runDatasetToShow={runDatasetToShow}
        setShowRunPlotsModal={setShowRunPlotsModal}
        visible={true}
      />
    );
  };

  it('renders without crashing', () => {
    const wrapper = mount();
    expect(wrapper.find('.pipeline-run-plots-modal').length).toBe(1);
  });
});
