import React from 'react';
import ShareableUrlModal from './shareable-url-modal';
import { setup } from '../../utils/state.mock';
import { screen } from '@testing-library/react';

describe('ShareableUrlModal', () => {
  it('renders without crashing', () => {
    setup.render(<ShareableUrlModal visible={true} />);
    expect(
      screen.getByText(/Publish and Share Kedro-Viz/i)
    ).toBeInTheDocument(); // <- ✅ this actually exists
  });
});
