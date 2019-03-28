import React from 'react';
import { shallow } from 'enzyme';
import App from './index';
import { fakeData } from '../../utils/test-data';

describe('App', () => {
  describe('renders without crashing', () => {
    it('when loading random data', () => {
      shallow(<App data="random" />);
    });

    it('when loading json data', () => {
      shallow(<App data="json" />);
    });

    it('when being passed data as a prop', () => {
      shallow(<App data={fakeData} />);
    });

    it('when enabling history, history deletion, and uploads', () => {
      shallow(
        <App
          allowHistoryDeletion={true}
          allowUploads={true}
          data="random"
          showHistory={true}
        />
      );
    });
  });

  describe('updates the store', () => {
    const getSnapshotIDs = wrapper =>
      wrapper.instance().store.getState().snapshotIDs;

    it('when data prop is set on first load', () => {
      const wrapper = shallow(<App data={fakeData} />);
      expect(getSnapshotIDs(wrapper)).toHaveLength(1);
    });

    it('when data prop is updated', () => {
      const wrapper = shallow(<App data={fakeData} />);
      const newFakeData = fakeData.concat(fakeData[0]);
      wrapper.setProps({ data: newFakeData });
      expect(getSnapshotIDs(wrapper)).toHaveLength(2);
    });
  });

  describe('throws an error', () => {
    it('when data prop is empty', () => {
      expect(() => shallow(<App />)).toThrow();
    });
  });
});
