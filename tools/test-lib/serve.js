const { execSync } = require('child_process');

const cwd = 'tools/test-lib/react-app/';

console.log('Starting dev server');
execSync(`npm start`, { cwd });
