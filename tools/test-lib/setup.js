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
(async function () {
  console.log('Packing into tarball…');
  const pack = await exec('npm pack --ignore-scripts');
  const filename = pack.stdout.trim();
  console.log(filename);

  console.log('Moving tarball file…');
  fs.renameSync(filename, `${cwd + tarball}`);
  console.log(`Moved to /${cwd + tarball}`);

  console.log('Deleting node_modules/@quantumblack/kedro-viz…');
  await exec('rm -rf node_modules/@quantumblack/kedro-viz', { cwd });
  console.log('Deleted');

  console.log('Installing dependencies…');
  execSync(`npm install --no-package-lock`, { cwd });

  console.log('Deleting tarball…');
  await exec(`rm -f ${tarball}`, { cwd });
  console.log('Deleted');
})();
