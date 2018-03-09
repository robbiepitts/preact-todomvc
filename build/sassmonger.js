const { make, helpers } = require('@filemonger/main');
const { join, parse, relative, resolve } = require('path');
const { Observable } = require('rxjs');
const sass = Observable.bindNodeCallback(require('node-sass').render);

module.exports = make((srcDir, destDir, opts) => {
	const entry = join(srcDir, opts.file || 'index.scss');

	console.time('sass');

	return sass({
		includePaths: [resolve('node_modules')],
		...opts,
		file: entry
	})
		.mergeMap(result => {
			const parts = parse(relative(srcDir, entry));
			const file = join(destDir, parts.dir, parts.name) + '.css';

			return helpers.writeFile(file, result.css);
		})
		.do(() => {
			console.timeEnd('sass');
		});
});
