const { makeFilemonger, helpers } = require('@filemonger/main');
const { join, parse, relative } = require('path');
const { Observable } = require('rxjs');
const watchman = require('fb-watchman');

module.exports = makeFilemonger((srcDir$, _, { entry }) => {
	const client = new watchman.Client();
	const capabilityCheck = Observable.bindNodeCallback(
		client.capabilityCheck.bind(client)
	);
	const command = Observable.bindNodeCallback(client.command.bind(client));
	const subscription$ = Observable.fromEvent(client, 'subscription');
	const makeSubscription = (watch, relativePath) => {
		const sub = {
			expression: ['allof', ['type', 'f'], ['not', 'empty']],
			fields: ['name'],
			relative_root: relativePath ? relativePath : undefined
		};

		return command(['subscribe', watch, 'filemonger', sub])
			.catch(err => {
				client.end();
				throw err;
			})
			.mergeMapTo(subscription$);
	};

	return srcDir$.flatMap(srcDir =>
		capabilityCheck({ required: ['relative_root'] })
			.mergeMapTo(command(['watch-project', srcDir]))
			.mergeMap(({ watch, relative_path }) =>
				makeSubscription(watch, relative_path)
			)
			.catch(err => {
				client.end();
				throw err;
			})
			.mapTo(srcDir)
	);
});
