//FIX THIS TESTS
import React from 'react';
import { render } from '@testing-library/react';
import App from './index';
import getRandomPipeline from '../../utils/random-data';
// import spaceflights from '../../utils/data/spaceflights.mock.json';
// import demo from '../../utils/data/demo.mock.json';

describe('App', () => {
  it('renders without crashing with random pipeline data', () => {
    render(<App data={getRandomPipeline()} />);
  });

  // it("resets the active pipeline when data prop is updated, if the active pipeline is not included in the new dataset's list of pipelines", () => {
  //   const activePipeline = spaceflights.pipelines.find(
  //     (pipeline) => !demo.pipelines.map((d) => d.id).includes(pipeline.id)
  //   );

  //   const { container, rerender } = render(<App data={spaceflights} />);
  //   const pipelineDropdown = container.querySelector('.pipeline-list');
  //   const menuOption = within(pipelineDropdown).getByText(activePipeline.name);
  //   const pipelineDropdownLabel = pipelineDropdown.querySelector(
  //     '.dropdown__label > span:first-child'
  //   );

  //   expect(pipelineDropdownLabel.innerHTML).toBe('__default__');
  //   fireEvent.click(menuOption);
  //   expect(pipelineDropdownLabel.innerHTML).toBe(activePipeline.name);

  //   rerender(<App data={demo} />);
  //   expect(pipelineDropdownLabel.innerHTML).toBe('__default__');
  // });
});
