const path = require('path');
const config = require('./package.json');

// eslint-disable-next-line require-jsdoc
function createConfig(options) {
  const targetExtension = (options.target === "umd") ? "" : "." + options.target;
  const minExtension = (options.minimize === true) ? ".min" : "";
  return {
    "mode": "production",
    "optimization": {
      "minimize": options.minimize
    },
    "entry": [
      "./src/index.js"
    ],
    "output": {
      "path": path.resolve(__dirname, 'dist'),
      "filename": 'lidojs-' + config.version + targetExtension + minExtension + '.js',
      "library": 'editolido',
      "libraryTarget": options.target
    },
  };
}

module.exports = [
    createConfig({"target": "var", "minimize": true}),
    createConfig({"target": "var", "minimize": false}),
    createConfig({"target": "umd", "minimize": true}),
    createConfig({"target": "umd", "minimize": false}),
];
