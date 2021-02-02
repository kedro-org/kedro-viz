const { execSync } = require('child_process');

/**
 * Running `npm ci` fails about 5% of the time on Windows in CircleCI.
 * This appears to be an issue with the 'fsevents' subdependency:
 * https://github.com/fsevents/fsevents/issues/301
 *
 * Attempts to fix it have failed, so this workaround instructs CircleCI to try
 * repeatedly to install dependencies, and only stop after 5 failed attempts.
 */

const maxAttempts = 5;

for (let i = 1; i <= maxAttempts; i++) {
  try {
    console.log(`Installing dependencies, attempt ${i} of ${maxAttempts}...`);
    console.log('$ npm ci');
    execSync(`npm ci`, { stdio: 'inherit' });
    break;
  } catch (e) {
    if (i === maxAttempts) {
      throw new Error(e);
    } else {
      console.log(`Attempt ${i} failed.`);
      console.error(e);
    }
  }
}
