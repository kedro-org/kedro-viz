import React from 'react';
import { shallow } from 'enzyme';
import App from './index';
import { mockData } from '../../utils/data.mock';

describe('App', () => {
  describe('renders without crashing', () => {
    it('when loading random data', () => {
      shallow(<App data="random" />);
    });

    it('when loading json data', () => {
      shallow(<App data="json" />);
    });

    it('when being passed data as a prop', () => {
      shallow(<App data={mockData} />);
    });

    it('when enabling history and history deletion', () => {
      shallow(
        <App allowHistoryDeletion={true} data="random" showHistory={true} />
      );
    });
  });

  describe('updates the store', () => {
    const getSnapshotIDs = wrapper =>
      wrapper.instance().store.getState().snapshotIDs;

    it('when data prop is set on first load', () => {
      const wrapper = shallow(<App data={mockData} />);
      expect(getSnapshotIDs(wrapper)).toHaveLength(mockData.length);
    });

    it('when data prop is updated', () => {
      const wrapper = shallow(<App data={mockData} />);
      const newMockData = Object.assign([], mockData.concat(mockData[0]));
      wrapper.setProps({ data: newMockData });
      expect(getSnapshotIDs(wrapper)).toHaveLength(newMockData.length);
    });
  });

  describe('throws an error', () => {
    it('when data prop is empty', () => {
      expect(() => shallow(<App />)).toThrow();
    });
  });
});
