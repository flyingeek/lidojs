const path = require('path');
const config = require('./package.json');

module.exports = {
  "mode": 'production',
  "entry": [
      './src/index.js'
  ],
  "output": {
    "path": path.resolve(__dirname, 'dist'),
    "filename": 'lidojs-' + config.version + '.js',
    "library": 'editolido',
    "libraryTarget": 'umd'
  },
};
