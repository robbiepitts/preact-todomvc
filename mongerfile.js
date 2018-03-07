const appmonger = require('./build/appmonger');

const watch = process.env.NODE_ENV === 'dev';

module.exports = appmonger('src', { watch });
