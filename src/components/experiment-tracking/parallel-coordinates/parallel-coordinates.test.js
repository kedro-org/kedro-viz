import React from 'react';
import { mount } from 'enzyme';

import { HoverStateContext } from '../utils/hover-state-context';
import { ParallelCoordinates } from './parallel-coordinates';
import { data, oneSelectedRun, selectedRuns } from '../mock-data';

const mockContextValue = {
  hoveredElementId: null,
  setHoveredElementId: jest.fn(),
};

describe('Parallel Coordinates renders correctly with D3', () => {
  it('renders without crashing', () => {
    const svg = mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <ParallelCoordinates metricsData={data} selectedRuns={oneSelectedRun} />
      </HoverStateContext.Provider>
    )
      .find('div')
      .find('svg');

    expect(svg.length).toEqual(1);
  });

  it('render the correct number of metric-axis from the data', () => {
    const metricAxises = mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <ParallelCoordinates metricsData={data} selectedRuns={oneSelectedRun} />
      </HoverStateContext.Provider>
    )
      .find('div')
      .find('svg')
      .find('.metric-axis');

    const graphKeys = Object.keys(data.metrics);

    expect(metricAxises.length).toEqual(graphKeys.length);
  });

  it('run-lines should be limited to less than 10, even if its more than 10 from the data', () => {
    const runLine = mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <ParallelCoordinates metricsData={data} selectedRuns={oneSelectedRun} />
      </HoverStateContext.Provider>
    ).find('.run-line');

    expect(runLine.length).toBeLessThan(10);
  });

  it('text from the tick-values should be displayed in ascending order', () => {
    const tickValues = mount(
      <HoverStateContext.Provider value={mockContextValue}>
        <ParallelCoordinates metricsData={data} selectedRuns={oneSelectedRun} />
      </HoverStateContext.Provider>
    )
      .find('div')
      .find('svg')
      .find('.tick-values');

    const text = tickValues.map((value) => value.text());
    // Since the text is in the format of ['1.0001.3002.4003.0003.3003.4004.5005.3006.500']
    // we need to remove the extra '00' in the middle
    const textValues = text.map((each) => each.split('00'));

    // Then ensure all are number, and the last character 00 should also be removed
    const formattedTextValues = textValues.map((array) => {
      array.splice(-1);
      return array.map((each) => Number(each));
    });

    const graphData = Object.entries(data.metrics);

    graphData.forEach(([metricName, values], metricIndex) => {
      const uniqueValues = values
        .filter((value, i, self) => self.indexOf(value) === i)
        .filter((value) => value !== null)
        .sort((a, b) => a - b);

      formattedTextValues.forEach((text, index) => {
        if (index === metricIndex) {
          expect(text).toEqual(uniqueValues);
        }
      });
    });
  });

  it('tick-values are only highlighted once per axis', () => {});

  it('shows tooltip when tooltip prop sets as visible', () => {});

  it('hides tooltip when tooltip prop does not set as visible', () => {});
});

describe('Parallel Coordinates" interactions', () => {
  it('applies "run-line--hovered" to the run line when hovering over', () => {});

  it('applies "run-line--faded" to all the run lines that are not included in the hovered modes', () => {});

  it('applies "text--hovered" to the tick values when hovering over', () => {});

  it('applies "text--faded" to all the tick values that are not included in the hovered modes', () => {});

  it('applies "line--hovered" to the tick lines when hovering over', () => {});

  it('applies "line--faded" to all the tick lines that are not included in the hovered modes', () => {});

  it('applies "metric-axis--hovered" to the metric-axis when hovering over', () => {});

  it('applies "metric-axis--faded" to all the metric-axis that are not included in the hovered modes', () => {});

  it('in single run, applies "run-line--selected-first" class to "line" when selecting a new run', () => {});

  it('in comparison mode, applies classnames accordingly to "line"', () => {});
});
