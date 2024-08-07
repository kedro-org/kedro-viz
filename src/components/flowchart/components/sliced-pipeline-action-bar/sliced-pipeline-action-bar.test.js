// sliced-pipeline-action-bar.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SlicedPipelineActionBar } from './sliced-pipeline-action-bar';

describe('SlicedPipelineActionBar', () => {
  it('displays notification message when notification prop is true', () => {
    const ref = {
      current: {
        firstChild: { getBoundingClientRect: () => ({ width: 100 }) },
      },
    };
    render(
      <SlicedPipelineActionBar
        chartSize={{ outerWidth: 800 }}
        slicedPipeline={[]}
        visibleSidebar={true}
        notification={true}
        displayMetadataPanel={false}
        ref={ref}
      />
    );
    const notification = screen.getByText(
      /Hold Shift \+ Click on another node to slice pipeline/i
    );
    expect(notification).toBeInTheDocument();
  });

  it('displays "Slice" button when slicedPipeline is not empty', () => {
    const ref = {
      current: {
        firstChild: { getBoundingClientRect: () => ({ width: 100 }) },
      },
    };
    render(
      <SlicedPipelineActionBar
        chartSize={{ outerWidth: 800 }}
        slicedPipeline={[1, 2, 3]}
        visibleSidebar={true}
        notification={false}
        displayMetadataPanel={false}
        ref={ref}
      />
    );
    const sliceButton = screen.getByRole('button', { name: /slice/i });
    expect(sliceButton).toBeInTheDocument();
  });
});
