import React from 'react';
import RunDataset from '.';
import { runs, trackingData } from '../../experiment-wrapper/mock-data';
import { shallow } from 'enzyme';

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
});
