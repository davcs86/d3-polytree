/* global __dirname */

var webpack = require('webpack');
var path = require('path');

module.exports = function() {
  return {
    entry: {
      Canvas: './lib/D3Canvas'
    },
    devtool: 'source-map',
    output: {
      path: __dirname + '/dist',
      filename: 'D3P.[name].js',
      library: 'D3P',
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        d3: path.join(__dirname, '/d3/d3')
      }
    },
    module: {
      rules: [
        {
          test: /\.js$|\.es6$/,
          exclude: /(node_modules|bower_components|dist|d3)/,
          enforce: 'pre',
          use: [{loader: 'eslint-loader'}]
        }
      ]
    },
    plugins: [
      new webpack.LoaderOptionsPlugin({
        eslint: {
          emitError: true,
          failOnError: true
        }
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'commons',
        filename: 'D3P.Commons.js',
        chunks: ['Viewer', 'InteractiveViewer', 'Editor']
      }),
      new webpack.optimize.AggressiveMergingPlugin({
        moveToParents: true
      }),
      new webpack.optimize.UglifyJsPlugin()
    ]
  };
};