// sliced-pipeline-action-bar.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { SlicedPipelineActionBar } from './sliced-pipeline-action-bar';

describe('SlicedPipelineActionBar', () => {
  it('displays "Slice" button when slicedPipeline is not empty', () => {
    const ref = {
      current: {
        firstChild: { getBoundingClientRect: () => ({ width: 100 }) },
      },
    };
    const { container } = render(
      <SlicedPipelineActionBar
        chartSize={{ outerWidth: 800 }}
        displayMetadataPanel={false}
        isSlicingPipelineApplied={false}
        onApplySlicingPipeline={() => {}}
        onResetSlicingPipeline={() => {}}
        runCommand={'mock run command'}
        ref={ref}
        slicedPipelineLength={3}
        visibleSidebar={true}
      />
    );
    const ctaElement = container.querySelector(
      '.sliced-pipeline-action-bar--cta'
    );

    expect(ctaElement).toBeInTheDocument();
    const sliceButton = ctaElement.querySelector('button');
    expect(sliceButton).toBeInTheDocument();
  });
});
