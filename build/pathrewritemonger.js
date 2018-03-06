const { make, helpers } = require('@filemonger/main');
const cheerio = require('cheerio');
const { Observable } = require('rxjs');
const { readFileSync } = require('fs');
const { join } = require('path');

module.exports = make((srcDir, destDir, { pattern, replacer }) =>
	helpers
		.filesInDir(srcDir)
		.mergeMap(entrypoint => {
			const html = readFileSync(join(srcDir, entrypoint)).toString();
			const $ = cheerio.load(html);
			const scripts = $('script').each((_, el) => {
				el.attribs['src'] = el.attribs['src'].replace(pattern, replacer);
			});
			const styles = $("link[rel='stylesheet']").each((_, el) => {
				el.attribs['href'] = el.attribs['href'].replace(pattern, replacer);
			});

			return helpers.writeFile(join(destDir, entrypoint), $.html());
		})
		.concat(Observable.of(null))
		.last()
);
