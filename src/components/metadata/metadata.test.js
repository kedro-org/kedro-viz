import React from 'react';
import MetaData from './index';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import { setup, mockState } from '../../utils/state.mock';
import { addEdgeLinks } from '../../utils/graph/graph';

describe('MetaData', () => {
  // Add edge links, can be removed when new graph is default
  addEdgeLinks(mockState.animals.graph.nodes, mockState.animals.graph.edges);

  const mount = props => {
    mockState.animals.node.clicked = props.nodeId;
    return setup.mount(
      <MetaData metadata={getClickedNodeMetaData(mockState.animals)} />
    );
  };

  const textOf = elements => elements.map(element => element.text());
  const rows = wrapper => wrapper.find('.pipeline-metadata__row');
  const title = wrapper => wrapper.find('.pipeline-metadata__title');
  const rowIcon = row => row.find('svg.pipeline-metadata__icon');
  const rowLabel = row => row.find('.pipeline-metadata__label');
  const rowValue = row => row.find('.pipeline-metadata__value');
  const rowByLabel = (wrapper, label) =>
    rows(wrapper).findWhere(
      row => rowLabel(row).length && rowLabel(row).text() === label
    );

  it('shows the node type as an icon', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    expect(rowIcon(wrapper).hasClass('pipeline-node-icon--type-task')).toBe(
      true
    );
  });

  it('shows the node name as the title', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    expect(textOf(title(wrapper))).toEqual(['salmon']);
  });

  it('shows the node type as text', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    const row = rowByLabel(wrapper, 'Type:');
    expect(textOf(rowValue(row))).toEqual(['task']);
  });

  it('shows the node inputs', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    const row = rowByLabel(wrapper, 'Inputs:');
    expect(textOf(rowValue(row))).toEqual([
      'cat',
      'dog',
      'parameters',
      'parameters_rabbit'
    ]);
  });

  it('shows the node outputs', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    const row = rowByLabel(wrapper, 'Outputs:');
    expect(textOf(rowValue(row))).toEqual(['horse', 'pig', 'sheep']);
  });

  it('shows the node tags', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    const row = rowByLabel(wrapper, 'Tags:');
    expect(textOf(rowValue(row))).toEqual(['small']);
  });

  it('shows the node pipeline', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    const row = rowByLabel(wrapper, 'Pipeline:');
    expect(textOf(rowValue(row))).toEqual(['Default']);
  });

  it('shows the node run command', () => {
    const wrapper = mount({ nodeId: 'task/salmon' });
    const row = rowByLabel(wrapper, 'Run Command:');
    expect(textOf(rowValue(row))).toEqual(['kedro run --to-nodes salmon']);
  });

  it('copies run command when button clicked', () => {
    window.navigator.clipboard = {
      writeText: jest.fn()
    };

    const wrapper = mount({ nodeId: 'task/salmon' });
    const copyButton = wrapper.find('button.pipeline-metadata__copy-button');

    copyButton.simulate('click');

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'kedro run --to-nodes salmon'
    );
  });
});
