import node from 'rollup-plugin-node-resolve';

export default {
  entry: 'assets/d3/index.js',
  format: 'umd',
  moduleName: 'd3',
  plugins: [node()],
  dest: 'assets/d3/d3.js'
};