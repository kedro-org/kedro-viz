import React from 'react';
import RunDataset from '.';
import { runs, trackingData } from '../../experiment-wrapper/mock-data';
import { shallow, mount } from 'enzyme';

const booleanTrackingData = [
  {
    datasetName: 'Data Analysis',
    data: {
      classWeight: [{ runId: 'My Favorite Sprint', value: false }],
    },
  },
];

const ObjectTrackingData = [
  {
    datasetName: 'Data Analysis',
    data: {
      classWeight: [{ runId: 'My Favorite Sprint', value: { a: true } }],
    },
  },
];

describe('RunDataset', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(
      <RunDataset
        isSingleRun={runs.length === 1 ? true : false}
        trackingData={trackingData}
      />
    );

    expect(wrapper.find('.details-dataset').length).toBe(1);
    expect(wrapper.find('.details-dataset__accordion').length).toBe(3);
  });

  it('renders a boolean value as a string', () => {
    const wrapper = mount(
      <RunDataset isSingleRun={true} trackingData={booleanTrackingData} />
    );

    expect(wrapper.find('.details-dataset__value').text()).toBe('false');
  });

  it('renders a boolean value as a string', () => {
    const wrapper = mount(
      <RunDataset isSingleRun={true} trackingData={ObjectTrackingData} />
    );

    const datasetValue = wrapper.find('.details-dataset__value').text();

    expect(typeof datasetValue).toBe('string');
  });
});
