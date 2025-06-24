import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import UpdateReminder from './update-reminder';
import { updateContent } from './update-reminder-content';
import { setup } from '../../utils/state.mock';

const numberNewFeatures = updateContent.features.length;

describe('Update Reminder', () => {
  const versionOutOfDate = {
    latest: '4.3.1',
    installed: '4.2.0',
    isOutdated: true,
  };
  const versionsUpToDate = {
    latest: '4.3.1',
    installed: '4.3.1',
    isOutdated: false,
  };

  it('renders without crashing', () => {
    const { container } = setup.render(
      <UpdateReminder
        isOutdated={versionOutOfDate.isOutdated}
        version={versionOutOfDate}
      />
    );
    expect(
      container.querySelector('.update-reminder-unexpanded')
    ).toBeInTheDocument();
  });

  it('popup expands when it is clicked', () => {
    setup.render(
      <UpdateReminder
        isOutdated={versionOutOfDate.isOutdated}
        version={versionOutOfDate}
      />
    );
    const expandBtn = document.querySelectorAll('.buttons-container button')[0];
    fireEvent.click(expandBtn);
    expect(
      document.querySelector('.update-reminder-expanded-header')
    ).toBeInTheDocument();
  });

  it('dismisses when the dismiss button is clicked', () => {
    setup.render(
      <UpdateReminder
        isOutdated={versionOutOfDate.isOutdated}
        version={versionOutOfDate}
      />
    );
    const dismissBtn = document.querySelectorAll(
      '.buttons-container button'
    )[1];
    fireEvent.click(dismissBtn);
    expect(
      document.querySelector('.update-reminder-expanded-header')
    ).not.toBeInTheDocument();
  });

  it('shows the correct version tag when outdated', () => {
    setup.render(
      <UpdateReminder
        isOutdated={versionOutOfDate.isOutdated}
        version={versionOutOfDate}
      />
    );
    const buttons = document.querySelectorAll('.buttons-container button');
    fireEvent.click(buttons[1]);
    const tag = document.querySelector(
      '.update-reminder-version-tag--outdated'
    );
    expect(tag).toBeInTheDocument();
  });

  it('shows the correct version tag when up to date', () => {
    setup.render(
      <UpdateReminder
        isOutdated={versionsUpToDate.isOutdated}
        version={versionsUpToDate}
      />
    );
    expect(
      document.querySelector('.update-reminder-version-tag--up-to-date')
    ).toBeInTheDocument();
  });

  it('shows feature release information', () => {
    setup.render(
      <UpdateReminder
        isOutdated={versionOutOfDate.isOutdated}
        version={versionOutOfDate}
      />
    );
    const expandBtn = document.querySelectorAll('.buttons-container button')[0];
    fireEvent.click(expandBtn);
    expect(
      document.querySelector('.update-reminder-expanded-content')
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll('.update-reminder-expanded-content--feature')
        .length
    ).toBe(numberNewFeatures);
  });

  it('shows new version information', () => {
    setup.render(
      <UpdateReminder
        isOutdated={versionOutOfDate.isOutdated}
        version={versionOutOfDate}
      />
    );
    const expandBtn = document.querySelectorAll('.buttons-container button')[0];
    fireEvent.click(expandBtn);
    expect(screen.getByText('Kedro-Viz 4.3.1 is here!')).toBeInTheDocument();
  });

  it('shows the user is up to date', () => {
    setup.render(
      <UpdateReminder
        isOutdated={versionsUpToDate.isOutdated}
        version={versionsUpToDate}
      />
    );
    const tag = document.querySelector(
      '.update-reminder-version-tag--up-to-date'
    );
    fireEvent.click(tag);
    expect(screen.getByText("You're up to date")).toBeInTheDocument();
    expect(screen.getByText('Kedro-Viz 4.3.1')).toBeInTheDocument();
  });
});
