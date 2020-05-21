/* eslint-env node */
import fs from 'fs'
import path from 'path'

export const loadDataAsString = function(filename) {
  const dataPath = path.resolve(__dirname, 'data/');
  // eslint-disable-next-line no-sync
  return fs.readFileSync(path.resolve(dataPath, filename), 'utf8');
};

export const loadWmo = function() {
  const dataPath = path.resolve(__dirname, '../dist');
  // eslint-disable-next-line no-sync
  const data = fs.readFileSync(path.resolve(dataPath, "wmo.json"), 'utf8');
  return JSON.parse(data)
}
