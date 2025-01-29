// This file gets loaded automatically before all the test files.

import './commands';
import { localStorageETDeprecationBannerSeen } from '../../src/config';

// Command to perform before each test case run
beforeEach(() => {
  cy.__conditionalVisit__();
  cy.window().then((win) => {
    win.localStorage.setItem(localStorageETDeprecationBannerSeen, JSON.stringify(true));
  });
  cy.reload();
});
