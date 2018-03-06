const { make, helpers } = require('@filemonger/main');
const { Observable } = require('rxjs');
const { rollup } = require('rollup');
const { join, resolve, isAbsolute } = require('path');

module.exports = make((srcDir, destDir, { entry = 'index.js' }) => {
	const rollupConfigPath = resolve(process.cwd(), 'rollup.config.js');
	const config = rollup({
		input: rollupConfigPath,
		external: id =>
			(id[0] !== '.' && !isAbsolute(id)) || id.slice(-5, id.length) === '.json'
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
		});

	return config.then(c =>
		rollup({ ...c, input: join(srcDir, entry) }).then(bundle =>
			bundle.write({ ...c.output, file: join(destDir, entry) })
		)
	);
});
