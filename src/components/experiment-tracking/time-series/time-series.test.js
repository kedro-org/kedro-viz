import React from 'react';
import { mount } from 'enzyme';

import { getSelectedOrderedData, TimeSeries } from './time-series';
import { HoverStateContext } from '../utils/hover-state-context';
import { formatTimestamp } from '../../../utils/date-utils';
import { data, selectedRuns } from '../mock-data';

const metricsKeys = Object.keys(data.metrics);

const runKeys = Object.keys(data.runs);
const runData = Object.entries(data.runs);

const hoveredRunIndex = 0;

describe('TimeSeries with hoveredElementId value', () => {
  const mockContextValue = {
    hoveredElementId: runKeys[0],
    setHoveredElementId: jest.fn(),
  };

  const wrapper = mount(
    <HoverStateContext.Provider value={mockContextValue}>
      <TimeSeries metricsData={data} selectedRuns={selectedRuns}></TimeSeries>
    </HoverStateContext.Provider>
  );

  it('renders without crashing', () => {
    expect(wrapper.find('.time-series').length).toBe(1);
  });
  it('constructs an svg for each metric from the data', () => {
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
  it('applies "time-series__run-line--hovered" class to the correct runLine on mouseover', () => {
    const runLine = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__run-lines')
      .find('line')
      .at(hoveredRunIndex);

    expect(runLine.hasClass('time-series__run-line--hovered')).toBe(true);
  });
  it('show tooltip onHover - runLine', () => {
    wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__run-lines')
      .find('line')
      .at(hoveredRunIndex)
      .simulate('mouseover');

    const tooltip = wrapper.find('.time-series').find('.tooltip');

    expect(tooltip.hasClass('tooltip--show')).toBe(true);
  });
  it('selected group is returend in the correct order', () => {
    const selectedGroupLine = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__selected-group')
      .find('line');

    getSelectedOrderedData(runData, selectedRuns).forEach(([key, _], index) => {
      const parsedSelectedDate = new Date(formatTimestamp(selectedRuns[index]));

      if (parsedSelectedDate.getTime() === key.getTime()) {
        expect(
          selectedGroupLine
            .at(index)
            .hasClass(`time-series__run-line--selected-${index}`)
        ).toBe(true);
      }
    });
  });
});

describe('TimeSeries with "hoveredElementId = null"', () => {
  const mockContextValue = {
    hoveredElementId: null,
    setHoveredElementId: jest.fn(),
  };

  const wrapper = mount(
    <HoverStateContext.Provider value={mockContextValue}>
      <TimeSeries metricsData={data} selectedRuns={selectedRuns}></TimeSeries>
    </HoverStateContext.Provider>
  );

  it('applies "time-series__run-line--blend" class to the correct runLine on mouseover', () => {
    const runLine = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__run-lines')
      .find('line')
      .at(hoveredRunIndex);

    expect(selectedRuns.length > 1).toBe(true);
    expect(runLine.hasClass('time-series__run-line--blend')).toBe(true);
  });

  it('applies "time-series__metric-line--blend" class to the correct metricLine on mouseover', () => {
    const metricLine = wrapper
      .find('.time-series')
      .find('svg')
      .find('g')
      .find('.time-series__metric-line')
      .at(hoveredRunIndex);

    expect(selectedRuns.length > 1).toBe(true);
    expect(metricLine.hasClass('time-series__metric-line--blend')).toBe(true);
  });
});
