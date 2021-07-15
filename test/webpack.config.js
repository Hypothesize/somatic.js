module.exports = {
	context: __dirname,
	entry: './dist/test/test.index.js',
	output: {
		path: __dirname + '/dist',
		filename: 'index.bundle.js'
	},
	resolve: {
		extensions: ['.js', '.jsx']
	},
	node: {
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
	},
	target: 'web'
}