import * as path from "path";
import * as webpack from "webpack";

import * as CopyWebpackPlugin from "copy-webpack-plugin";
import * as ExtractTextPlugin from "extract-text-webpack-plugin";

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
                        configFileName: tsconfig
                    }
                }]
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },

            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract([{
                    loader: "css-loader", // translates CSS into CommonJS
                    options: {
                        sourceMap: true,
                    }
                }, {
                    loader: "less-loader", // compiles Less to CSS
                    options: {
                        noIeCompat: true,
                        sourceMap: true,
                    }
                }])
            },
        ]
    },

    target: "electron-renderer",
    node: {
        __filename: true,
        __dirname: true
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                "NODE_ENV": JSON.stringify(process.env.NODE_ENV)
            },
            "require.extensions": false
        }),
        new ExtractTextPlugin("bundle.css"),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin([
            {
                from: 'node_modules/monaco-editor/dev/vs',
                to: 'vs',
            },
            {
                from: path.resolve(src, "index.html"),
                to: "index.html"
            },
            {
                from: path.resolve(src, "package.json"),
                to: "package.json"
            }
        ]),
    ],

    devServer: {
        hot: true,
        contentBase: "out",
        port: 3000
    }
};

export const main: webpack.Configuration = {
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
            { test: /\.tsx?$/, loader: "awesome-typescript-loader", options: { configFileName: tsconfig } },

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
