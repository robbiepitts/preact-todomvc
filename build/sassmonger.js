const { make, helpers } = require('@filemonger/main');
const { join, parse, relative, resolve } = require('path');
const { Observable } = require('rxjs');
const sass = Observable.bindNodeCallback(require('node-sass').render);

module.exports = make((srcDir, destDir, { entry = 'index.scss' }) =>
	sass({
		file: join(srcDir, entry),
		includePaths: [resolve('node_modules')]
	}).mergeMap(result => {
		const parts = parse(entry);
		const file = join(destDir, parts.dir, parts.name) + '.css';

		return helpers.writeFile(file, result.css);
	})
);
