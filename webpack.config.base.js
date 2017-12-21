/**
 * Base webpack config used across other specific configs
 */

const path = require("path");
const { dependencies: externals } = require("./app/package-app.json"); // was just package.json, but hatton changed because tslint once in awhile would look in ther for dependencies and break down in confusion

module.exports = {
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loaders: ["react-hot-loader/webpack", "ts-loader"],
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: "json-loader"
      },
      {
        test: /\.(html)$/,
        use: {
          loader: "html-loader"
        }
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: "html-loader"
          },
          {
            loader: "markdown-loader"
          }
        ]
      }
    ]
  },

  output: {
    path: path.join(__dirname, "app"),
    filename: "bundle.js",

    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: "commonjs2"
  },

  // https://webpack.github.io/docs/configuration.html#resolve
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
    modules: [path.join(__dirname, "app"), "node_modules"]
  },

  plugins: [],

  externals: Object.keys(externals || {})
};
