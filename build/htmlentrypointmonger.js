const { make, helpers } = require('@filemonger/main');
const { filtermonger } = require('@filemonger/filtermonger');
const { readFile, readdirSync } = require('fs');
const { join, relative, extname } = require('path');
const cheerio = require('cheerio');
const { Observable, Subject } = require('rxjs');
const babelmonger = require('./babelmonger');
const webpackmonger = require('./webpackmonger');
const sassmonger = require('./sassmonger');

module.exports = make(
	(srcDir, destDir, { entry = 'index.html', refresh = [entry] }) => {
		const entrypoint$ = Observable.bindNodeCallback(readFile)(
			join(srcDir, entry)
		)
			.map(buf => buf.toString())
			.map(html => cheerio.load(html))
			.mergeMap($ =>
				Observable.merge(
					Observable.of(entry),
					Observable.from(
						$('script')
							.map((_, el) => el.attribs['src'])
							.toArray()
					),
					Observable.from(
						$("link[rel='stylesheet']")
							.map((_, el) => el.attribs['href'])
							.toArray()
					)
				)
			);
		const refresh$ = hasHTML(refresh)
			? entrypoint$
			: entrypoint$.filter(entrypoint =>
					refresh.map(extname).includes(extname(entrypoint))
			  );

		return refresh$.multicast(
			() => new Subject(),
			refresh$ =>
				Observable.merge(
					refresh$
						.filter(asset => extname(asset) === '.html')
						.mergeMap(entry =>
							filtermonger(srcDir, { pattern: entry }).writeTo(destDir)
						),
					refresh$.filter(asset => extname(asset) === '.js').mergeMap(script =>
						babelmonger(srcDir)
							.bind(srcDir => webpackmonger(srcDir, { entry: script }))
							.writeTo(destDir)
					),
					refresh$
						.filter(asset => extname(asset) === '.scss')
						.mergeMap(stylesheet =>
							sassmonger(srcDir, { entry: stylesheet }).writeTo(destDir)
						)
				).last()
		);
	}
);

function hasHTML(files) {
	return files.filter(file => file.slice(-5) === '.html').length > 0;
}

function hasJS(files) {
	return files.filter(file => file.slice(-3) === '.js').length > 0;
}

function hasSCSS(files) {
	return files.filter(file => file.slice(-5) === '.scss').length > 0;
}
