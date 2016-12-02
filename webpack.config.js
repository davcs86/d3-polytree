var webpack = require("webpack");
var path = require("path");

module.exports = {
  entry: {
    Viewer: ["./lib/Viewer"],
    InteractiveViewer: ["./lib/InteractiveViewer"],
    Editor: ["./lib/Editor"],
    testModdle: ["./lib/testModdle"]
  },
  devtool: process.env.WEBPACK_DEVTOOL || "source-map",
  output: {
    path: path.join(__dirname, "docs"),
    filename: "D3P.[name].js",
    library: ["D3P"],
    libraryTarget: "umd"
  },
  resolve: {
    extensions: ["", ".js", ".css", ".scss", ".svg", ".json"],
    alias: {
      d3: path.join(__dirname, '/d3/d3.min')
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
        loader: "style-loader!css-loader"
      },
      {
        test: /\.scss$/,
        loader: "style-loader!css-loader!sass-loader"
      }
    ],
    preLoaders: [
      {
        test: /\.js$|\.es6$/,
        exclude: /(node_modules|bower_components|docs|d3)/,
        loaders: ["eslint-loader"]
      }
    ]
  },
  svgoConfig: {
    plugins: [
      {removeTitle: true},
      {convertColors: {shorthex: false}},
      {convertPathData: false}
    ]
  },
  eslint: {
    emitError: true,
    failOnError: true
  },
  devServer: {
    contentBase: "./docs",
    noInfo: false,
    hot: true,
    inline: true
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      filename: "D3P.Commons.js",
      chunks: ["Viewer", "InteractiveViewer", "Editor"]
    }),
    //new webpack.optimize.UglifyJsPlugin()
  ]
};