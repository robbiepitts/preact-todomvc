const { make, helpers } = require('@filemonger/main');
const { join, parse, relative, resolve } = require('path');
const { Observable } = require('rxjs');
const readFile = Observable.bindNodeCallback(require('fs').readFile);
const babel = Observable.bindNodeCallback(require('babel-core').transformFile);

module.exports = make((srcDir, destDir) => {
	console.time('babel');

	const config$ = readFile(resolve('.babelrc')).map(JSON.parse);

	return helpers
		.filesInDir(srcDir, '**/*.js')
		.mergeMap(file =>
			config$.mergeMap(config =>
				babel(join(srcDir, file), config).mergeMap(
					({ code, map }) =>
						map
							? Observable.forkJoin(
									helpers.writeFile(join(destDir, file), code),
									helpers.writeFile(join(destDir, `${file}.map`), map)
							  )
							: helpers.writeFile(join(destDir, file), code)
				)
			)
		)
		.concat(Observable.of(null))
		.last()
		.do(() => {
			console.timeEnd('babel');
		});
});
