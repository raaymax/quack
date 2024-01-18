const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { InjectManifest} = require('workbox-webpack-plugin');
const webpack = require('webpack');
const config = require('@quack/config');
const pack = require('../../package.json');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      APP_VERSION: JSON.stringify(pack.version),
      APP_NAME: JSON.stringify(pack.name),
      PLUGIN_LIST: JSON.stringify(config.plugins),
      API_URL: JSON.stringify(config.apiUrl),
    }),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: './src/assets', to: 'assets' },
        { from: './src/manifest.json', to: '.' },
        { from: './src/index.html', to: '.' },
      ],
    }),
    new InjectManifest({
      exclude: [],
      maximumFileSizeToCacheInBytes: 1024 * 1024 * 10,
      swSrc: './src/sw.js',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
    ],
  },
  mode: 'development',
  devtool: 'eval-source-map',
};
