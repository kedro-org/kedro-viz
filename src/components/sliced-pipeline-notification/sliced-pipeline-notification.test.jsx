import React from 'react';
import { render, screen } from '@testing-library/react';
import { SlicedPipelineNotification } from './sliced-pipeline-notification';

describe('SlicedPipelineNotification', () => {
  test('renders with a notification message', () => {
    const notification = 'Test Notification';
    render(
      <SlicedPipelineNotification
        notification={notification}
        visibleSidebar={true}
      />
    );
    expect(screen.getByText(notification)).toBeInTheDocument();
  });

  test('applies correct class when visibleSidebar is true', () => {
    render(
      <SlicedPipelineNotification notification="Test" visibleSidebar={true} />
    );
    const notificationElement = screen.getByText('Test');
    expect(notificationElement).toHaveClass('sliced-pipeline-notification');
    expect(notificationElement).not.toHaveClass(
      'sliced-pipeline-notification--no-sidebar'
    );
  });

  test('applies correct class when visibleSidebar is false', () => {
    render(
      <SlicedPipelineNotification notification="Test" visibleSidebar={false} />
    );
    const notificationElement = screen.getByText('Test');
    expect(notificationElement).toHaveClass(
      'sliced-pipeline-notification',
      'sliced-pipeline-notification--no-sidebar'
    );
  });
});
