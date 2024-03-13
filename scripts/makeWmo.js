const fs = require('fs/promises');
const path = require('path');
const Geohash = require('ngeohash');
const {wmoParser} = require('./wmo_parsers');

/* Our current list of Ogimet's known WMO index */
const ogimetIds = require('./ogimet_idx.json');

/* If needed we can exlude stations by their ID (like 74038) or their name (like LIMT) */
const excludedStations = [];

/* Where to save */
const wmoVarPath = "./dist/wmo.var.js";
const wmoPath = "./dist/wmo.json";

console.log(`${excludedStations.length} excluded stations`);
console.log(`${ogimetIds.length} ogimet stations`);
console.log(`consider updating ogimet stations with npm run updateogimet`);

/**
 * geoEncode
 * @param {Array} data [label, latitude, longitude]
 * @param {number} precision (geohash precision)
 * @returns {Object} indexed by geohash, a list of [[label, latitude, longitude],...]
 */
function geoEncode(data, precision=3) {
  const results = {};
  for (const [label, latitude, longitude] of data) {
    const geohash = Geohash.encode(latitude, longitude, precision);
    const value = [label, +latitude.toFixed(6), +longitude.toFixed(6)]
    if (geohash in results) {
        results[geohash].push(value);
    } else {
        results[geohash] = [value];
    }
  }
  return results;
}

wmoParser(ogimetIds, excludedStations).then(async data => {
  await fs.mkdir(path.dirname(wmoPath), {'recursive': true});
  const geohashedData = geoEncode(data);
  fs.writeFile(wmoPath, JSON.stringify(geohashedData), (err) => {
    if (err) {
      throw err;
    } else {
      console.log(`Saved ${data.length} stations!`);
    }
  });
  // according to Google engineers, JSON.parse is faster than the native js parsing
  fs.writeFile(wmoVarPath, `var WMO=JSON.parse('${JSON.stringify(geohashedData)}');\n`, (err) => {
    if (err) {
      throw err;
    }
  });
});
