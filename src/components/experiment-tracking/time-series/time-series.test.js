import React from 'react';
import { mount } from 'enzyme';

import { TimeSeries } from './time-series';
import { HoverStateContext } from '../utils/hover-state-context';
import { data } from '../mock-data';

const selectedRuns = ['2022-09-05T12.27.04.496Z'];

describe('TimeSeries', () => {
  it('renders without crashing', () => {
    const mockValue = {
      hoveredElementId: null,
      setHoveredElementId: jest.fn(),
    };

    const width = jest
      .spyOn(document, 'querySelector')
      .mockImplementation(() => 100);

    const wrapper = mount(
      <HoverStateContext.Provider value={mockValue}>
        <TimeSeries metricsData={data} selectedRuns={selectedRuns}></TimeSeries>
      </HoverStateContext.Provider>
    );

    expect(wrapper.find('.time-series').length).toBe(1);
  });
  it('constructs an svg', () => {});
  it('draw axes', () => {});
  it('draw metricLine', () => {});
  it('draw runLines', () => {});
  it('draw slectedRun with different color and symbol', () => {});
  it('onHover highlight the line and drawn dotted horizontal line', () => {});
  it('onHover shows tooltip', () => {});
});
