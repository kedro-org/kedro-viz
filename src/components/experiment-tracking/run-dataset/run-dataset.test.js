import React from 'react';
import RunDataset from '.';
import { runs, trackingData } from '../../experiment-wrapper/mock-data';
import { shallow, mount } from 'enzyme';

const booleanTrackingData = {
  JSONData: [
    {
      datasetName: 'Data Analysis',
      data: {
        classWeight: [{ runId: 'My Favorite Sprint', value: false }],
      },
    },
  ],
};

const objectTrackingData = {
  JSONData: [
    {
      datasetName: 'Data Analysis',
      data: {
        classWeight: [{ runId: 'My Favorite Sprint', value: { a: true } }],
      },
    },
  ],
};

const comparisonTrackingData = {
  metrics: [
    {
      datasetName: 'Data Analysis',
      data: {
        classWeight: [
          { runId: 'My Favorite Sprint', value: 12 },
          { runId: 'My second Favorite Sprint', value: 13 },
        ],
      },
    },
  ],
};

const showDiffTrackingData = {
  metrics: [
    {
      datasetName: 'Data Analysis',
      data: {
        classWeight: [
          { runId: 'My Favorite Sprint', value: 12 },
          { runId: 'My second Favorite Sprint', value: 13 },
        ],
        r2Score: [{ runId: 'My second Favorite Sprint', value: 0.2342356 }],
      },
    },
  ],
};

describe('RunDataset', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(
      <RunDataset
        isSingleRun={runs.length === 1 ? true : false}
        selectedRunIds={['abc']}
        trackingData={trackingData}
      />
    );

    expect(wrapper.find('.details-dataset').length).toBe(1);
    expect(wrapper.find('.details-dataset__accordion').length).toBe(4);
  });

  it('renders a boolean value as a string', () => {
    const wrapper = mount(
      <RunDataset
        isSingleRun={true}
        selectedRunIds={['abc']}
        trackingData={booleanTrackingData}
      />
    );

    expect(wrapper.find('.details-dataset__value').text()).toBe('false');
  });

  it('renders a boolean value as a string', () => {
    const wrapper = mount(
      <RunDataset
        isSingleRun={true}
        selectedRunIds={['abc']}
        trackingData={objectTrackingData}
      />
    );

    const datasetValue = wrapper.find('.details-dataset__value').text();

    expect(typeof datasetValue).toBe('string');
  });

  it('renders the comparison arrow when showChanges is on', () => {
    const wrapper = mount(
      <RunDataset
        enableShowChanges={true}
        isSingleRun={false}
        pinnedRun={'My Favorite Sprint'}
        selectedRunIds={['abc', 'def']}
        trackingData={comparisonTrackingData}
      />
    );

    expect(wrapper.find('.dataset-arrow-icon').length).toBe(1);
  });

  it('for runs with different metrics, it renders a cell with a - value', () => {
    const wrapper = mount(
      <RunDataset
        isSingleRun={false}
        selectedRunIds={['My Favorite Sprint', 'My second Favorite Sprint']}
        trackingData={showDiffTrackingData}
      />
    );

    console.log(wrapper.debug());

    expect(wrapper.find('.details-dataset__value').at(2).text()).toBe('-');
  });
});
