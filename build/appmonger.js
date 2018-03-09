const fm = require('@filemonger/main');
const { filtermonger } = require('@filemonger/filtermonger');
const watch = require('./watch');
const babelmonger = require('./babelmonger');
const webpackmonger = require('./webpackmonger');
const sassmonger = require('./sassmonger');
const { join, extname } = require('path');
const { Observable } = require('rxjs');

const uniq = arr => Array.from(new Set(arr));

const buildmonger = fm.make((srcDir, destDir, { refresh }) => {
	const mongers = new Map([
		['.html', filtermonger(srcDir, { pattern: 'index.html' })],
		['.scss', sassmonger(join(srcDir, 'styles'), { file: 'index.scss' })],
		[
			'.js',
			babelmonger(join(srcDir, 'app')).bind(srcDir =>
				webpackmonger(srcDir, { entry: 'index.js' })
			)
		]
	]);
	const reducer = (memo, nextMonger) =>
		Observable.merge(
			memo,
			nextMonger ? nextMonger.writeTo(destDir) : Observable.of(null)
		);

	return (refresh
		? uniq(refresh.map(extname).map(ext => mongers.get(ext))).reduce(
				reducer,
				Observable.of(null)
		  )
		: Array.from(mongers.values()).reduce(reducer, Observable.of(null))
	).last();
});

const appmonger = fm.make((srcDir, destDir, opts = { watch: false }) =>
	(opts.watch
		? watch(srcDir, refresh => buildmonger(srcDir, { refresh }))
		: buildmonger(srcDir)
	).writeTo(destDir)
);

module.exports = appmonger;
