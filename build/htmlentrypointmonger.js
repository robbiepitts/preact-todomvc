const { make, helpers } = require('@filemonger/main');
const { filtermonger } = require('@filemonger/filtermonger');
const { readFileSync, readdirSync } = require('fs');
const { join, relative } = require('path');
const cheerio = require('cheerio');
const { Observable, Subject } = require('rxjs');
const watchDir = require('./watch-dir');
const rollupmonger = require('./rollupmonger');
const sassmonger = require('./sassmonger');

module.exports = make((srcDir, destDir, { entry, watch }) => {
	const $ = cheerio.load(readFileSync(join(srcDir, entry)).toString());
	const scripts = $('script')
		.map((_, el) => el.attribs['src'])
		.toArray();
	const stylesheets = $("link[rel='stylesheet']")
		.map((_, el) => el.attribs['href'])
		.toArray();
	const processHTML = () =>
		filtermonger(srcDir, { pattern: entry }).writeTo(destDir);
	const processJS = () =>
		Observable.forkJoin(
			scripts.map(script =>
				rollupmonger(srcDir, { entry: script }).writeTo(destDir)
			)
		);
	const processSCSS = () =>
		Observable.forkJoin(
			stylesheets.map(stylesheet =>
				sassmonger(srcDir, { entry: stylesheet }).writeTo(destDir)
			)
		);
	const startWatch = () =>
		watchDir(srcDir)
			.filter(files => hasJS(files) || hasSCSS(files))
			.do(files => console.log('Files changed:', ...files))
			.do(() => console.log('Rebuilding'))
			.do(() => console.time('Done'))
			.multicast(
				() => new Subject(),
				files$ =>
					Observable.combineLatest(
						files$.filter(hasJS).mergeMap(processJS),
						files$.filter(hasSCSS).mergeMap(processSCSS)
					)
			)
			.do(() => console.timeEnd('Done'));

	if (watch) {
		return Observable.combineLatest(processHTML(), startWatch());
	}

	return Observable.forkJoin(processHTML(), processJS(), processSCSS());
});

function hasHTML(files) {
	return files.filter(file => file.slice(-5) === '.html').length > 0;
}

function hasJS(files) {
	return files.filter(file => file.slice(-3) === '.js').length > 0;
}

function hasSCSS(files) {
	return files.filter(file => file.slice(-5) === '.scss').length > 0;
}
