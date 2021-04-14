module.exports = {
    target: "serverless",
    distDir: "dist",
    // TODO: it was causing `Error: Can't resolve 'bufferutil' in '/.../node_modules/ws/lib'
    // revisit it to use webpack5
    // future: {
    //     webpack5: true,
    // },
};
