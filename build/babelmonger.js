const { make, helpers } = require('@filemonger/main');
const { join, parse, relative, resolve } = require('path');
const { readFileSync } = require('fs');
const { Observable } = require('rxjs');
const babel = Observable.bindNodeCallback(require('babel-core').transformFile);

module.exports = make((srcDir, destDir) => {
	const config = JSON.parse(readFileSync(resolve('.babelrc')));

	return helpers
		.filesInDir(srcDir, '**/*.js')
		.mergeMap(file =>
			babel(join(srcDir, file), config).mergeMap(({ code, map }) =>
				Observable.forkJoin(
					helpers.writeFile(join(destDir, file), code),
					helpers.writeFile(join(destDir, `${file}.map`), map)
				)
			)
		)
		.concat(Observable.of(null))
		.last();
});
