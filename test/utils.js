/* eslint-env node */
import fs from 'fs'
import path from 'path'

export const loadDataAsString = function(filename) {
  let dataPath = path.resolve(__dirname, 'data/');
  // eslint-disable-next-line no-sync
  return fs.readFileSync(path.resolve(dataPath, filename), 'utf8');
};
