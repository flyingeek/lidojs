const path = require('path');
const webpack = require('webpack');
const config = require('./package.json');
// eslint-disable-next-line require-jsdoc
function createConfig(options) {
  const targetExtension = (options.target === "umd") ? "" : "." + options.target;
  const minExtension = (options.minimize === true) ? ".min" : "";
  return {
    "mode": "production",
    "devtool": 'source-map',
    "optimization": {
      "minimize": options.minimize
    },
    "entry": [
      "./src/index.js"
    ],
    "output": {
      "path": path.resolve(__dirname, 'dist'),
      "filename": 'lidojs' + targetExtension + minExtension + '.js',
      "library": 'editolido',
      "libraryTarget": options.target
    },
    "module": {
      "rules": [
        {
          "test": /\.m?js$/u,
          "exclude": /(node_modules|bower_components)/u,
          "use": {
            "loader": 'babel-loader',
            "options": {
              "presets": ['@babel/preset-env'],
              "plugins": ['@babel/plugin-transform-named-capturing-groups-regex']
            }
          }
        }
      ]
    },
    "plugins": [
      new webpack.DefinePlugin({
        'VERSION': JSON.stringify(config.version)
      })
    ]
  }
}
module.exports = [
  createConfig({"target": "var", "minimize": true}),
  createConfig({"target": "var", "minimize": false}),
  createConfig({"target": "umd", "minimize": true}),
  createConfig({"target": "umd", "minimize": false})
];
