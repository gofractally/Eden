const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production',
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "node_modules/xterm/css/xterm.css" },
                { from: "cltester.js" },
                { from: "cltester.wasm" },
                { from: "cltester.worker.js" },
                { from: "test.html" },
            ],
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        })
    ],
};
