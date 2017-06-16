import * as path from "path";
import * as webpack from "webpack";

const src = path.resolve(__dirname, "..", "src");
const out = path.resolve(__dirname, "..", "out");

const config: webpack.Configuration = {
    entry: path.resolve(src, "main.ts"),

    output: {
        filename: "main.js",
        path: out
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader", options: { configFileName: path.resolve(src, "tsconfig.json") } },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
        ]
    },

    target: "electron-main",
    node: {
        __dirname: false,
        __filename: false,
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                "NODE_ENV": JSON.stringify(process.env.NODE_ENV)
            }
        }),
    ],
};

export = config;
