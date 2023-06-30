const path = require('path');

export const validateImage = (downloadedFilename) => {
  const downloadsFolder = Cypress.config('downloadsFolder');

  if (!downloadedFilename) {
    downloadedFilename = path.join(downloadsFolder, 'logo.png');
  }

  // ensure the file has been saved before trying to parse it
  cy.readFile(`${downloadsFolder}/${downloadedFilename}`, 'binary', {
    timeout: 15000,
  }).should((buffer) => {
    expect(buffer.length).to.be.gt(1000);
  });
};
