const appmonger = require('./build/appmonger');
const htmlentrypointmonger = require('./build/htmlentrypointmonger');

const watch = process.env.NODE_ENV === 'dev';

module.exports = appmonger('src', { watch });
