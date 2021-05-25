import React from 'react';
import PlotlyModal from './index';
import { toggleNodeClicked } from '../../actions/nodes';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import { setup, prepareState } from '../../utils/state.mock';
import { togglePlotModal } from '../../actions';
import animals from '../../utils/data/animals.mock.json';
import nodePlot from '../../utils/data/node_plot.mock.json';

const bullPlotNodeID = 'c3p345ed';

describe('Plotly Modal', () => {
  // prepare mock metadata with plot data
  const metadata = getClickedNodeMetaData(
    prepareState({
      data: animals,
      afterLayoutActions: [() => toggleNodeClicked(bullPlotNodeID)],
    })
  );
  metadata.plot = nodePlot.plot;

  const mount = (props) => {
    return setup.mount(<PlotlyModal metadata={metadata} />, {
      beforeLayoutActions: [() => toggleNodeClicked(props.nodeId)],
      afterLayoutActions: [
        () => {
          // Click the expected node
          return togglePlotModal(true);
        },
      ],
    });
  };

  it('renders without crashing', () => {
    const wrapper = mount({ nodeId: bullPlotNodeID });
    expect(wrapper.find('.pipeline-plotly-modal').length).toBe(1);
  });

  it('modal closes when collapse button is clicked', () => {
    const wrapper = mount({ nodeId: bullPlotNodeID });
    wrapper.find('.pipeline-plot-modal__collapse-plot').simulate('click');
    expect(wrapper.find('.pipeline-plotly-modal').length).toBe(0);
  });

  it('modal closes when back button is clicked', () => {
    const wrapper = mount({ nodeId: bullPlotNodeID });
    wrapper.find('.pipeline-plot-modal__back').simulate('click');
    expect(wrapper.find('.pipeline-plotly-modal').length).toBe(0);
  });

  it('shows plot when a plot node is clicked', () => {
    const wrapper = mount({ nodeId: bullPlotNodeID });
    expect(wrapper.find('.pipeline-plot-modal__header').length).toBe(0);
    expect(wrapper.find('.pipeline-plotly-chart').length).toBe(0);
  });
});
