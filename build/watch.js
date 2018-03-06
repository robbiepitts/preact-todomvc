const { make, helpers } = require('@filemonger/main');
const { join, parse, relative, resolve } = require('path');
const { readdirSync } = require('fs');
const { Observable, Subject } = require('rxjs');
const watchman = require('fb-watchman');

module.exports = function watch(watchDir, factory) {
	const client = new watchman.Client();
	const capabilityCheck = Observable.bindNodeCallback(
		client.capabilityCheck.bind(client)
	);
	const command = Observable.bindNodeCallback(client.command.bind(client));
	const makeSubscription = (watch, relativePath) => {
		const sub = {
			expression: ['allof', ['type', 'f'], ['not', 'empty']],
			fields: ['name']
		};

		if (relativePath) {
			sub.relative_root = relativePath;
		}

		return command(['subscribe', watch, 'filemonger', sub]).mergeMapTo(
			Observable.fromEvent(client, 'subscription')
		);
	};

	return make((_, destDir) =>
		capabilityCheck({ required: ['relative_root'] })
			.mergeMap(() => command(['watch-project', resolve(watchDir)]))
			.mergeMap(({ watch, relative_path }) =>
				makeSubscription(watch, relative_path).map(ev => ev.files)
			)
			.catch(err => {
				client.end();
				throw err;
			})
			.do(files => console.log('Files changed:', ...files))
			.do(() => console.log('Rebuilding'))
			.do(() => console.time('Done'))
			.map(factory)
			.mergeMap(monger => monger.writeTo(destDir))
			.do(() => console.timeEnd('Done'))
	)();
};
