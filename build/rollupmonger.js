const { makeFilemonger, helpers } = require('@filemonger/main');
const { Observable } = require('rxjs');
const { rollup } = require('rollup');
const { join, resolve, isAbsolute } = require('path');

module.exports = makeFilemonger((srcDir$, destDir, { entry }) => {
	const rollupConfigPath = resolve(process.cwd(), 'rollup.config.js');
	const config$ = Observable.fromPromise(
		rollup({
			input: rollupConfigPath,
			external: id =>
				(id[0] !== '.' && !isAbsolute(id)) ||
				id.slice(-5, id.length) === '.json'
		})
			.then(bundle =>
				bundle.generate({
					format: 'cjs'
				})
			)
			.then(({ code }) => {
				const defaultLoader = require.extensions['.js'];

				// Basically eval the rolled up rollup.config.js
				require.extensions['.js'] = (m, filename) => {
					filename === rollupConfigPath
						? m._compile(code, filename)
						: defaultLoader(m, filename);
				};

				return Promise.resolve(require(rollupConfigPath)).then(config => {
					require.extensions['.js'] = defaultLoader;

					return config;
				});
			})
	);

	return config$.mergeMap(c =>
		srcDir$.mergeMap(srcDir =>
			Observable.fromPromise(
				rollup({ ...c, input: join(srcDir, entry) }).then(bundle =>
					bundle.write({ ...c.output, file: join(destDir, entry) })
				)
			)
		)
	);
});
