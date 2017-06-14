const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractLess = new ExtractTextPlugin({
    filename: "bundle.css",
});

module.exports = {
    entry: [
        "react-hot-loader/patch",
        "./src/index.tsx"
    ],

    output: {
        filename: "bundle.js",
        path: __dirname + "/out",
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
                loader: [
                    "react-hot-loader/webpack",
                    "awesome-typescript-loader"
                ]
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },

            {
                test: /\.less$/,
                use: extractLess.extract([{
                    loader: "css-loader", // translates CSS into CommonJS
                    options: {
                        sourceMap: true
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
        extractLess,
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin([
            {
                from: 'node_modules/monaco-editor/dev/vs',
                to: 'vs',
            }
        ])
    ],

    devServer: {
        hot: true,
        contentBase: __dirname + "/out",
        port: 3000
    }
};
