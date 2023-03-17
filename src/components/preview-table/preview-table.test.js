import React from 'react';
import { mount } from 'enzyme';
import PreviewTable from './preview-table';

const mockData = {
  id: { 0: 'id1', 1: 'id2', 2: 'id3' },
  companyRating: { 0: '100%', 1: '67%', 2: '67%' },
  companyLocation: { 0: 'London', 1: 'Paris', 2: 'New York' },
};

describe('Preview Table', () => {
  it('renders without crashing', () => {
    const wrapper = mount(<PreviewTable data={mockData} />);

    expect(wrapper.find('.preview-table').length).toBe(1);
  });

  it('it should render the correct amount of header and rows', () => {
    const wrapper = mount(<PreviewTable data={mockData} />);

    const headers = Object.keys(mockData);
    const nRows = Object.keys(mockData[headers[0]]);

    expect(wrapper.find('.preview-table__header').length).toBe(headers.length);
    expect(wrapper.find('.preview-table__row').length).toBe(nRows.length);
  });
});
