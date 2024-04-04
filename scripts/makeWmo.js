/* eslint-disable no-sync */
const fs = require('fs');
const path = require('path');
const Geohash = require('ngeohash');
//const {wmoParser} = require('./wmo_parsers');

/* Our current list of Ogimet's known WMO index
  This is not exactly true so we also have to perform cross check, see ogimet_lib
*/
// const ogimetIds = require('./ogimet_idx.json');
const ogimetScrapy = require('./ogimet.json');

/* If needed we can exlude stations by their ID (like 74038) or their name (like LIMT) */
const excludedStations = [];

/* Where to save */
const wmoVarPath = "./dist/wmo.var.js";
const wmoPath = "./dist/wmo.json";

console.log(`${excludedStations.length} excluded stations`);
console.log(`${ogimetScrapy.length} ogimet stations`);
console.log(`consider updating ogimet stations with scrapy-ogimet`);

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

const data = ogimetScrapy.filter(o => o.wid && o.wigos && !o.closed).map(o => [
  (o.icao && o.icao.match(/^[A-Z]{4}$/u)) ? o.icao : o.wid,
  o.latitude,
  o.longitude,
]);
const geohashedData = geoEncode(data);
fs.mkdirSync(path.dirname(wmoPath), {'recursive': true});
fs.writeFile(wmoPath, JSON.stringify(geohashedData), (err) => {
  if (err) {
    throw err;
  } else {
    console.log(`Saved ${data.length} stations!`);
  }
});
fs.writeFile(wmoVarPath, `var WMO=JSON.parse('${JSON.stringify(geohashedData)}');\n`, (err) => {
  if (err) {
    throw err;
  }
});

// wmoParser(ogimetIds, excludedStations).then(data => {
//   fs.mkdirSync(path.dirname(wmoPath), {'recursive': true});
//   const geohashedData = geoEncode(data);
//   fs.writeFile(wmoPath, JSON.stringify(geohashedData), (err) => {
//     if (err) {
//       throw err;
//     } else {
//       console.log(`Saved ${data.length} stations!`);
//     }
//   });
//   // according to Google engineers, JSON.parse is faster than the native js parsing
//   fs.writeFile(wmoVarPath, `var WMO=JSON.parse('${JSON.stringify(geohashedData)}');\n`, (err) => {
//     if (err) {
//       throw err;
//     }
//   });
// });
