import React from 'react';
import { render } from '@testing-library/react';
import { SlicedPipelineActionBar } from './sliced-pipeline-action-bar';

describe('SlicedPipelineActionBar', () => {
  it('displays notification message when notification prop is true', () => {
    const ref = {
      current: {
        firstChild: { getBoundingClientRect: () => ({ width: 100 }) },
      },
    };
    const { container } = render(
      <SlicedPipelineActionBar
        chartSize={{ outerWidth: 800 }}
        slicedPipeline={[]}
        visibleSidebar={true}
        notification={true}
        displayMetadataPanel={false}
        ref={ref}
      />
    );

    // Check for the presence of the notification class
    const notificationElement = container.querySelector(
      '.sliced-pipeline-action-bar--info'
    );
    expect(notificationElement).toBeInTheDocument();
    expect(notificationElement.textContent).toContain(
      'Hold Shift + Click on another node to slice pipeline'
    );
  });

  it('displays "Slice" button when slicedPipeline is not empty', () => {
    const ref = {
      current: {
        firstChild: { getBoundingClientRect: () => ({ width: 100 }) },
      },
    };
    const { container } = render(
      <SlicedPipelineActionBar
        chartSize={{ outerWidth: 800 }}
        slicedPipeline={[1, 2, 3]}
        visibleSidebar={true}
        notification={false}
        displayMetadataPanel={false}
        ref={ref}
      />
    );

    const ctaElement = container.querySelector(
      '.sliced-pipeline-action-bar--cta'
    );
    expect(ctaElement).toBeInTheDocument();

    const sliceButton = ctaElement.querySelector('button');
    expect(sliceButton).toBeInTheDocument();
    expect(sliceButton.textContent).toBe('Slice');
  });
});
