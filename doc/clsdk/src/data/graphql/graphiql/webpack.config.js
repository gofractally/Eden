const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: './index.tsx',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            crypto: false,
            buffer: require.resolve('buffer/'),
        },
    },
    performance: {
        hints: false,
    }
};
