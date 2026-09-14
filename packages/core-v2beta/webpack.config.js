/* global __dirname, process */

var webpack = require('webpack');
var path = require('path');

module.exports = function(){
  var outputDir = process.env.OUTPUT_DIR || './docs';
  if (!path.isAbsolute(outputDir)){
    outputDir = path.resolve(__dirname, outputDir);
  }

  console.log(outputDir);

  return {
    entry: {
      Viewer: ['./lib/Viewer'],
      InteractiveViewer: ['./lib/InteractiveViewer'],
      Editor: ['./lib/Editor']
    },
    devtool: 'source-map',
    output: {
      path: outputDir, //path.join(__dirname, 'docs'),
      filename: 'D3P.[name].js',
      library: ['D3P'],
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.js', '.css', '.scss', '.svg', '.json'],
      alias: {
        d3: path.join(__dirname, '/assets/d3/d3')
      }
    },
    module: {
      rules: [
        {
          test: /\.js$|\.es6$/,
          exclude: /(node_modules|bower_components|docs|assets)/,
          enforce: 'pre',
          use: [
            {
              loader: 'eslint-loader',
              options: {
                emitError: true,
                failOnError: true
              }
            }
          ]
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'svg-inline-loader'
            },
            {
              loader: 'svgo-loader',
              options: {
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
              }
            }
          ]
        },
        {
          test: /\.json$/,
          use: [
            {
              loader: 'json-loader'
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                minimize: true
              }
            },
            {
              loader: 'postcss-loader'
            }
          ]
        },
        {
          test: /\.scss$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                minimize: true
              }
            },
            {
              loader: 'postcss-loader'
            },
            {
              loader: 'sass-loader'
            }
          ]
        }
      ]
    },
    devServer: {
      contentBase: './docs',
      noInfo: false,
      hot: true,
      inline: true,
      port: 8083
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.optimize.AggressiveMergingPlugin({
        moveToParents: true
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'commons',
        filename: 'D3P.Commons.js',
        chunks: ['Viewer', 'InteractiveViewer', 'Editor']
      }),
      new webpack.optimize.UglifyJsPlugin({
        comments: false,
        sourceMap: true
      }),
      new webpack.BannerPlugin({
        banner: 'David Castillo <davcs86@gmail.com> | MIT License | https://github.com/davcs86/d3-polytree'
      })
    ]
  };
};