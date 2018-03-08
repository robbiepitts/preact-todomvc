module.exports = {
	entry: 'app/index.js',
	devtool: 'cheap-eval-source-map',
	module: {
		rules: [
			{
				test: /\.js$/,
				use: ['source-map-loader'],
				enforce: 'pre'
			}
		]
	}
};
