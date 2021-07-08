import React from 'react';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import { toggleNodeClicked } from '../../actions/nodes';
import { setup, prepareState } from '../../utils/state.mock';
import animals from '../../utils/data/animals.mock.json';
import MetaDataList from './metadata-list';

const salmonTaskNodeId = '443cf06a';

describe('Metadata Lists', () => {
  it('limits metadata list to x values and expands when button clicked', () => {
    const metadata = getClickedNodeMetaData(
      prepareState({
        data: animals,
        afterLayoutActions: [() => toggleNodeClicked(salmonTaskNodeId)],
      })
    );
    metadata.inputs = Array.from({ length: 20 }, (_, i) => `Test: ${i}`);
    const wrapper = setup.mount(
      <MetaDataList
        property="name"
        inline={false}
        commas={false}
        empty="-"
        values={metadata.inputs}
        limit={10}
      />
    );
    const expandButton = wrapper.find('.pipeline-metadata__value-list-expand');
    // Expand button should show remainder
    expect(expandButton.text()).toBe('+ 10 more');
    // Should show 10 values
    expect(wrapper.find('.pipeline-metadata__value').length).toBe(10);
    // User clicks to expand
    expandButton.simulate('click');
    // Should show all 20 values
    expect(wrapper.find('.pipeline-metadata__value').length).toBe(20);
  });
});
