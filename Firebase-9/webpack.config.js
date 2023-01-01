const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/app.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  watch: true,
  devtool: "source-map",
  // module: {
  //   rules: [
  //     {
  //       test: /\.js$/,
  //       enforce: "pre",
  //       use: ["source-map-loader"],
  //     },
  //   ],
  // },
};
