/* global __dirname */
var webpack = require('webpack');
var path = require('path');
//var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: {
    Viewer: ['./lib/Viewer'],
    InteractiveViewer: ['./lib/InteractiveViewer'],
    Editor: ['./lib/Editor']
  },
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'docs'),
    filename: 'CustomD3P.[name].js',
    library: ['CustomD3P'],
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['', '.js', '.css', '.scss', '.svg', '.json'],
    alias: {
      d3: path.join(__dirname, '/node_modules/d3-canvas/d3/d3.min'),
      fs: 'empty-module'
    }
  },
  module: {
    loaders: [
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader!svgo-loader?useConfig=svgoConfig',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
        options: {
          minimize: true,
          sourceMap: true
        }
      },
      {
        test: /\.scss$/,
        loader: 'style-loader!css-loader!sass-loader',
        options: {
          minimize: true,
          sourceMap: true
        }
      }
    ],
    preLoaders: [
      {
        test: /\.js$|\.es6$/,
        exclude: /(node_modules|bower_components|docs|d3)/,
        loaders: ['eslint-loader']
      }
    ]
  },
  svgoConfig: {
    plugins: [
      {
        removeTitle: true
      },
      {
        convertColors: {
          shorthex: false
        }
      },
      {
        convertPathData: false
      }
    ]
  },
  eslint: {
    emitError: true,
    failOnError: true
  },
  devServer: {
    contentBase: './docs',
    noInfo: false,
    hot: true,
    inline: false
  },
  plugins: [
    //new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'commons',
      filename: 'CustomD3P.Commons.js',
      chunks: ['Viewer', 'InteractiveViewer', 'Editor']
    }),
    new webpack.optimize.UglifyJsPlugin()
    //,new BundleAnalyzerPlugin()
  ]
};