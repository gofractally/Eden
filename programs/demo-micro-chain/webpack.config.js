const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
   entry: path.resolve(__dirname, 'index.js'),
   module: {
      rules: [
         {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: ['babel-loader'],
         },
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
            { from: 'index.html' },
            { from: 'node_modules/graphiql/graphiql.min.css' },
            { from: '../../build/demo-micro-chain.wasm' },
            { from: 'state' },
         ],
      }),
   ],
   resolve: {
      extensions: ['*', '.js', '.jsx'],
   },
   output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'bundle.js',
   },
   devServer: {
      contentBase: path.resolve(__dirname, './dist'),
   },
};
