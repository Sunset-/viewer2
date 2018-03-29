var path = require('path');
var UglifyJsPlugin = require("./node_modules/webpack/lib/optimize/UglifyJsPlugin");

module.exports = {
    entry: {
        eagleeyes: [
            'babel-polyfill',
            './src/js/app.js'
        ],
        eagleeyes_mini: [
            'babel-polyfill',
            './src/js/app-mini.js'
        ]
    },
    output: {
        path: path.join(__dirname, "eagleeyes"),
        filename: "[name].script.js"
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader',
            include: [
                path.resolve(__dirname, 'src')
            ],
            query: {
                cacheDirectory: true,
                "presets": ["es2015", "stage-1"],
                "plugins": ["babel-plugin-transform-decorators-legacy"]
            }
        }]
    },
    resolve: {
        root: [process.cwd() + '/src'],
        alias: {
            'Decorators': 'js/common/decorators.js'
        },
        extensions: ['', '.js', '.coffee', '.html', '.css', '.scss']
    },
    plugins: [
        //使用丑化js插件
        // new UglifyJsPlugin({
        //     compress: {
        //         warnings: false
        //     },
        //     mangle: {
        //         except: ['$scope', '$', 'Singleton','Decorators']
        //     }
        // })
    ]
};