const fm = require('@filemonger/main');
const { filtermonger } = require('@filemonger/filtermonger');
const watch = require('./watch');
const htmlentrypointmonger = require('./htmlentrypointmonger');
const pathrewritemonger = require('./pathrewritemonger');

const buildmonger = fm.make((srcDir, destDir, { entry, refresh }) =>
	htmlentrypointmonger(srcDir, { entry, refresh })
		.bind(srcDir =>
			fm.merge(
				filtermonger(srcDir, { pattern: '**/*.js' }),
				filtermonger(srcDir, { pattern: '**/*.js.map' }),
				filtermonger(srcDir, { pattern: '**/*.css' }),
				filtermonger(srcDir, { pattern: '**/*.html' }).bind(srcDir =>
					pathrewritemonger(srcDir, {
						pattern: /\.scss$/,
						replacer: '.css'
					})
				)
			)
		)
		.writeTo(destDir)
);

const appmonger = fm.make(
	(srcDir, destDir, opts = { entry: 'index.html', watch: false }) =>
		(opts.watch
			? watch(srcDir, refresh =>
					buildmonger(srcDir, { entry: opts.entry, refresh })
			  )
			: buildmonger(srcDir, { entry: opts.entry })
		).writeTo(destDir)
);

module.exports = appmonger;
