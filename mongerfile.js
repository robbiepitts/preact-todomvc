const watchmonger = require('./build/watchmonger');
const appmonger = require('./build/appmonger');
const rollupmonger = require('./build/rollupmonger');
const htmlentrypointmonger = require('./build/htmlentrypointmonger');

module.exports = watchmonger('src').bind(srcDir$ =>
	appmonger(srcDir$, { entry: 'index.html' })
);

// module.exports = htmlentrypointmonger('src', { entry: 'index.html' });
// module.exports = rollupmonger('src', { entry: 'app/index.js' });
// module.exports = appmonger('src', { entry: 'index.html' });
// module.exports = watchmonger('src');
