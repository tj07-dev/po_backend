const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/app.ts',
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  externals: [nodeExternals()],
  optimization: {
    minimize: true,
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

// const path = require('path');

// module.exports = {
//   entry: './src/app.ts',
//   mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
//   output: {
//     libraryTarget: 'commonjs2',
//     path: path.resolve(__dirname, '.webpack'),
//     filename: 'app.js',
//   },
//   module: {
//     rules: [
//       {
//         test: /\.ts$/,
//         use: 'ts-loader',
//         exclude: /node_modules/,
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.ts', '.js'],
//   },
// };
