const { makeFilemonger, helpers, filtermonger } = require('@filemonger/main');
const { readFileSync, readdirSync } = require('fs');
const { join, relative } = require('path');
const cheerio = require('cheerio');
const { Observable, Subject } = require('rxjs');
const watchDir = require('./watch-dir');
const rollupmonger = require('./rollupmonger');
const sassmonger = require('./sassmonger');

module.exports = makeFilemonger((srcDir$, destDir, { entry, watch }) => {
	return srcDir$.mergeMap(srcDir => {
		const $ = cheerio.load(readFileSync(join(srcDir, entry)).toString());
		const scripts = $('script')
			.map((_, el) => el.attribs['src'])
			.toArray();
		const stylesheets = $("link[rel='stylesheet']")
			.map((_, el) => el.attribs['href'])
			.toArray();

		if (watch) {
			const processJS = files$ =>
				Observable.combineLatest(
					scripts.map(script =>
						rollupmonger(files$.filter(hasJS).mapTo(srcDir), {
							entry: script
						}).unit(destDir)
					)
				);
			const processSCSS = files$ =>
				Observable.combineLatest(
					stylesheets.map(stylesheet =>
						sassmonger(files$.filter(hasSCSS).mapTo(srcDir), {
							entry: stylesheet
						}).unit(destDir)
					)
				);

			return filtermonger(srcDir, {
				pattern: entry
			})
				.unit(destDir)
				.mergeMapTo(
					watchDir(srcDir)
						.filter(files => hasJS(files) || hasSCSS(files))
						.do(() => console.log('Files changed:'))
						.do(files => files.forEach(file => console.log(file)))
						.do(() => console.log('Rebuilding'))
						.do(() => console.time('Done'))
						.multicast(
							() => new Subject(),
							files$ =>
								Observable.combineLatest(processJS(files$), processSCSS(files$))
						)
						.do(() => console.timeEnd('Done'))
				);
		}

		return Observable.combineLatest(
			filtermonger(srcDir, {
				pattern: entry
			}).unit(destDir),
			Observable.forkJoin(
				...scripts.map(script =>
					rollupmonger(srcDir, { entry: script }).unit(destDir)
				)
			).last(),
			Observable.forkJoin(
				...stylesheets.map(stylesheet =>
					sassmonger(srcDir, { entry: stylesheet }).unit(destDir)
				)
			).last()
		);
	});
});

function hasHTML(files) {
	return files.filter(file => file.match(/\.html$/)).length > 0;
}

function hasJS(files) {
	return files.filter(file => file.match(/\.js$/)).length > 0;
}

function hasSCSS(files) {
	return files.filter(file => file.match(/\.scss$/)).length > 0;
}
