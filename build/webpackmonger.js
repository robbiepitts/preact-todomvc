const { make, helpers } = require('@filemonger/main');
const { resolve, join, dirname, parse } = require('path');
const { Observable } = require('rxjs');
const webpack = require('webpack');

module.exports = make((srcDir, destDir, configOverrides = {}) => {
	const configPath = resolve('webpack.config.js');
	const config = require(configPath);
	const normalizeEntry = entry => {
		if (typeof entry === 'object' && entry.length) {
			return entry.map(e => resolve(srcDir, entry));
		}

		if (typeof entry === 'object') {
			return Object.keys(entry).reduce(
				(memo, k) => ({ ...memo, [k]: normalizeEntry(entry[k]) }),
				{}
			);
		}

		return resolve(srcDir, entry);
	};
	const normalizedConfig = {
		...config,
		entry: normalizeEntry(configOverrides.entry || config.entry),
		output: {
			path: join(destDir, dirname(config.entry)),
			filename: parse(config.entry).base
		}
	};

	return new Observable(subscriber => {
		webpack(normalizedConfig, (err, stats) => {
			const errors = err
				? [err]
				: stats.compilation.errors && stats.compilation.errors.length > 0
					? stats.compilation.errors
					: null;

			if (errors) {
				errors.forEach(error => {
					subscriber.error(error);
				});
			}

			subscriber.next();
			subscriber.complete();
		});
	}).last();
});
