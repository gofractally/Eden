module.exports = {
    target: "serverless",
    distDir: "dist",
    // TODO: it was causing `Error: Can't resolve 'bufferutil' in '/.../node_modules/ws/lib'
    // revisit it to use webpack5
    // future: {
    //     webpack5: true,
    // },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // // Note: we provide webpack above so you should not `require` it
        // // Perform customizations to webpack config
        // config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//))

        config.externals.push(
            (function () {
                var IGNORES = ["electron"];
                return function (context, request, callback) {
                    if (IGNORES.indexOf(request) >= 0) {
                        return callback(null, "require('" + request + "')");
                    }
                    return callback();
                };
            })()
        );

        // Fixes build with ts/lerna monorepo workspaces
        const tsRule = config.module.rules.find(
            (rule) => rule.test && rule.test.toString().includes("tsx|ts")
        );
        tsRule.include = undefined;
        tsRule.exclude = /node_modules/;

        // Important: return the modified config
        return config;
    },
};
