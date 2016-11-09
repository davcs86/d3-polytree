var webpack = require("webpack");
var path = require("path");

module.exports = {
  entry: {
    Viewer: ["./lib/Viewer"],
    //InteractiveViewer: "./lib/InteractiveViewer",
    //Editor: "./lib/Editor"
  },
  devtool: process.env.WEBPACK_DEVTOOL || "source-map",
  output: {
    path: path.join(__dirname, "docs"),
    filename: "D3P.[name].js",
    library: ["D3P"],
    libraryTarget: "umd"
  },
  externals: {
    d3: "d3"
  },
  resolve: {
    extensions: ["", ".js", ".css", ".scss", ".svg"]
  },
  module: {
    loaders: [
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader!line-art-loader',
      },
      {test: /\.css$/, loader: "style-loader!css-loader"},
      {test: /\.scss$/, loader: "style-loader!css-loader!sass-loader"}
    ],
    preLoaders: [
      {
        test: /\.js|\.es6?$/,
        exclude: /(node_modules|bower_components)/,
        loaders: ["eslint-loader"]
      }
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
    //new webpack.optimize.UglifyJsPlugin(),
    new webpack.ProvidePlugin({
      d3: "d3"
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      filename: "D3P.Commons.js",
      chunks: ["Viewer"]//, "InteractiveViewer", "Editor"]
    })
  ]
};