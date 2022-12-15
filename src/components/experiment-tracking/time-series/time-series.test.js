import React from 'react';
import { mount } from 'enzyme';

import { TimeSeries } from './time-series';
import { HoverStateContext } from '../utils/hover-state-context';
import { data, selectedRuns } from '../mock-data';

describe('TimeSeries', () => {
  const width = jest
    .spyOn(document, 'querySelector')
    .mockImplementation(() => 100);

  const metricsKeys = Object.keys(data.metrics);

  const runKeys = Object.keys(data.runs);
  const runData = Object.entries(data.runs);

  const mockValue = {
    hoveredElementId: runKeys[0],
    setHoveredElementId: jest.fn(),
  };

  const wrapper = mount(
    <HoverStateContext.Provider value={mockValue}>
      <TimeSeries metricsData={data} selectedRuns={selectedRuns}></TimeSeries>
    </HoverStateContext.Provider>
  );

  it('renders without crashing', () => {
    expect(wrapper.find('.time-series').length).toBe(1);
  });
  it('constructs an svg for each metric', () => {
    const svg = wrapper.find('.time-series').find('svg');
    expect(svg.length).toBe(metricsKeys.length);
  });
  it('draw X, Y and dual axes for each metric chart', () => {
    const xAxis = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__runs-axis');
    expect(xAxis.length).toBe(metricsKeys.length);

    const yAxis = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__metric-axis');
    expect(yAxis.length).toBe(metricsKeys.length);

    const dualAxis = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__metric-axis-dual');
    expect(dualAxis.length).toBe(metricsKeys.length);
  });
  it('draw metricLine for each metric', () => {
    const metricLine = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__metric-line');
    expect(metricLine.length).toBe(metricsKeys.length);
  });
  it('draw runLines for each metric', () => {
    const runLines = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__run-lines')
      .find('.time-series__run-line');
    expect(runLines.length).toBe(runData.length * metricsKeys.length);
  });
  it('applies hovered class to the correct runLine', () => {
    const runLine = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__run-lines')
      .find('line')
      .at(0);

    expect(runLine.hasClass('time-series__run-line--hovered')).toBe(true);
  });

  it('applies blend class to the correct runLine', () => {
    const runLine = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__run-lines')
      .find('line')
      .at(0);

    expect(selectedRuns.length > 1).toBe(true);
    expect(runLine.hasClass('time-series__run-line--blend')).toBe(true);
  });

  it('show tooltip onHover - runLine', () => {
    wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__run-lines')
      .find('line')
      .at(0)
      .simulate('mouseover');

    const tooltip = wrapper.find('.time-series').find('.tooltip');

    expect(tooltip.hasClass('tooltip--show')).toBe(true);
  });
});
