const { make, merge } = require('@filemonger/main');
const { filtermonger } = require('@filemonger/filtermonger');
const htmlentrypointmonger = require('./htmlentrypointmonger');
const pathrewritemonger = require('./pathrewritemonger');

const appmonger = make((srcDir, destDir, { entry, watch }) =>
	htmlentrypointmonger(srcDir, { entry, watch })
		.bind(srcDir =>
			merge(
				filtermonger(srcDir, { pattern: '**/*.js' }),
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

module.exports = appmonger;
