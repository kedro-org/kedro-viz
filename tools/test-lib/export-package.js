const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { execSync } = require('child_process');
const fs = require('fs');

const cwd = 'tools/test-lib/react-app/';
const tarball = 'kedro-viz.tgz';

/**
 * Pack KedroViz into tarball, move and install it in a simple React App,
 * to test exporting/importing the packaged npm library
 */
(async function() {
  console.log('Updating lib directory…');
  await exec('npm run lib');

  console.log('Packing into tarball…');
  const pack = await exec('npm pack');
  const filename = pack.stdout.trim();
  console.log(filename);

  console.log('Moving tarball file…');
  fs.renameSync(filename, `${cwd + tarball}`);
  console.log(`Moved to /${cwd + tarball}`);

  console.log('Installing dependencies…');
  execSync(`npm install --no-package-lock`, { cwd });

  console.log('Starting dev server');
  const start = await exec(`npm start`, { cwd });
  console.log(start);

  console.log('Deleting tarball…');
  fs.unlinkSync(cwd + tarball);
  console.log('Deleted');
})();
