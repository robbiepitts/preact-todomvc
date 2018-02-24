import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
	output: {
		format: 'iife',
		sourcemap: true
	},
	external: [],
	plugins: [babel(), nodeResolve({ jsnext: true }), commonjs(), uglify()]
};
