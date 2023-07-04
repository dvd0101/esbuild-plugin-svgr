const path = require("path");
const { readFileSync } = require('fs');
const { transform } = require('@svgr/core');

module.exports = (options = {}) => ({
    name: 'svgr',
    setup(build) {
        build.onResolve({ filter: /\.svg$/ }, async (args) => {
            switch (args.kind) {
                case 'import-statement':
                case 'require-call':
                case 'dynamic-import':
                case 'require-resolve':
                    // an import of a SVG from the code
                    return {
                        path: path.resolve(args.resolveDir, args.path),
                        namespace: "svgr",
                    };
                default:
                    // everything else, most probably an url from a CSS
                    return;
            }
        });

        build.onLoad({ filter: /\.svg$/, namespace: "svgr" }, async (args) => {
            const svg = readFileSync(args.path, { encoding: 'utf8' });
            const contents = await transform(svg, { ...options }, { filePath: args.path });

            if (args.suffix === '?url') {
                return {
                    contents: args.path,
                    resolveDir: path.dirname(args.path),
                    loader: 'text',
                };
            }

            return {
                contents,
                // the resolveDir is required in order to delegate the load to
                // a standard loader because we used a custom namespace
                resolveDir: path.dirname(args.path),
                loader: options.typescript ? 'tsx' : 'jsx',
            };
        });
    },
});
