const { makeFilemonger, helpers } = require('@filemonger/main');
const { join, parse, relative, resolve } = require('path');
const { readdirSync } = require('fs');
const { Observable, Subject } = require('rxjs');
const watchman = require('fb-watchman');

module.exports = function watchDir(srcDir) {
	const resolvedSrcDir = resolve(process.cwd(), srcDir);
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

	return capabilityCheck({ required: ['relative_root'] })
		.mergeMap(() => command(['watch-project', resolvedSrcDir]))
		.mergeMap(({ watch, relative_path }) =>
			makeSubscription(watch, relative_path).map(ev => ev.files)
		)
		.catch(err => {
			client.end();
			throw err;
		});
};
