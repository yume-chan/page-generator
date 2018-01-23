import * as path from "path";

import * as CopyWebpackPlugin from "copy-webpack-plugin";
import * as ExtractTextPlugin from "extract-text-webpack-plugin";
import * as webpack from "webpack";

const src = path.resolve(__dirname, "..", "src");
const out = path.resolve(__dirname, "..", "out");
const tsconfig = path.resolve(__dirname, "..", "tsconfig.json");

export const renderer: webpack.Configuration = {
    entry: [
        "react-hot-loader/patch",
        path.resolve(src, "index.tsx"),
    ],

    output: {
        filename: "bundle.js",
        path: out,
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.tsx?$/,
                use: [{
                    loader: "react-hot-loader/webpack",
                }, {
                    loader: "awesome-typescript-loader",
                    options: {
                        configFileName: tsconfig,
                    },
                }],
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                loader: "source-map-loader",
                test: /\.js$/,
            },

            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract([{
                    loader: "css-loader",
                    options: {
                        sourceMap: true,
                    },
                }, {
                    loader: "less-loader",
                    options: {
                        noIeCompat: true,
                        sourceMap: true,
                    },
                }]),
            },
        ],
    },

    node: {
        __dirname: true,
        __filename: true,
    },

    target: "electron-renderer",

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
            },
            "require.extensions": false,
        }),
        new ExtractTextPlugin("bundle.css"),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin([
            {
                from: "node_modules/monaco-editor/dev/vs",
                to: "vs",
            },
            {
                from: path.resolve(src, "index.html"),
                to: "index.html",
            },
            {
                from: path.resolve(src, "package.json"),
                to: "package.json",
            },
        ]),
    ],

    devServer: {
        contentBase: "out",
        hot: true,
        port: 3000,
    },
};

export const main: webpack.Configuration = {
    entry: path.resolve(src, "main.ts"),

    output: {
        filename: "main.js",
        path: out,
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader", options: { configFileName: tsconfig } },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
        ],
    },

    node: {
        __dirname: false,
        __filename: false,
    },

    target: "electron-main",

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
            },
        }),
    ],
};
