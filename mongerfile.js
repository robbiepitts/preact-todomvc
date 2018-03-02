const appmonger = require('./build/appmonger');
const rollupmonger = require('./build/rollupmonger');
const htmlentrypointmonger = require('./build/htmlentrypointmonger');

const watch = process.env.NODE_ENV === 'dev';

module.exports = appmonger('src', { entry: 'index.html', watch });
// module.exports = htmlentrypointmonger('src', { entry: 'index.html' });
// module.exports = rollupmonger('src', { entry: 'app/index.js' });
