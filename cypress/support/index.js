// This file gets loaded automatically before all the test files.

import './commands';

// Command to perform before each test case run
beforeEach(() => {
  cy.__conditionalVisit__();
  cy.window().then((win) => {
    win.localStorage.setItem('localStorageDeprecationBannerSeen', JSON.stringify({
      'experiment-tracking': true
    }));
  });
});
