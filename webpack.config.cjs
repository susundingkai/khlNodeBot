const path = require('path');
// import path from "path";
module.exports = {
    entry: './src/index.ts',
    mode: "development",
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
};
