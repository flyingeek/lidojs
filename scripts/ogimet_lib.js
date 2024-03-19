/*eslint no-sync: 0 */
const fs = require("fs");
const Papa = require('papaparse');
const {parserPromise} = require('./wmo_parsers');
const debugPath = "./scripts";

/*
  returns date in the format YYYYMMDDHH00, the hours parameters indicates the offset in hour from now
*/
const asYYYYMMDDHH00 = (hours) => {
  const ts = Date.now() + ((hours||0) * 3600000);
  return (new Date(ts)).toISOString()
    .replace(/[^\d]+/gu,'')
    .slice(0,10) + "00";
}

/**
  Process Ogimet SYNOP request and extract SYNOP IDs
  As the request in itself returns all synops in the period, it can be pretty big.
  There is a maximum of 200000 lines per request, 12 hours represents less than 50000 lines.
*/
function ogimet12HoursIndexSet(hours, debug=false) {
  const url = `https://www.ogimet.com/cgi-bin/getsynop?begin=${asYYYYMMDDHH00(hours-12)}&end=${asYYYYMMDDHH00(hours)}&lang=eng&header=yes`;
  return parserPromise(url, data => {
    if (debug) {
      fs.writeFileSync(`${debugPath}/debug_getsynop_${asYYYYMMDDHH00(hours-12)}.txt`, data, (err) => {
        if (err) {
          throw err;
        }
      });
    }
    const stationSet = new Set();
    const parsed = Papa.parse(data);
    parsed.data.slice(1).forEach((row) => {
      if (row[0].match(/^\d{5}$/u) && !row[6].endsWith('NIL=')) {
        stationSet.add(row[0]);
      }
    });

    return stationSet;
  });
}

/**
 * Batch request of the last 48 hours synops
 * @returns {Set} of wmo indexes
 */
async function ogimetIndexSet(debug=false) {
  const union = (setA, setB) => {
    const u = new Set(setA);
    for (let elem of setB) {
      u.add(elem);
    }
    return u;
  }
  let stations = await ogimet12HoursIndexSet(0, debug);
  stations = union(stations, await ogimet12HoursIndexSet(-12, debug));
  stations = union(stations, await ogimet12HoursIndexSet(-24, debug));
  stations = union(stations, await ogimet12HoursIndexSet(-36, debug));
  return stations;
}

module.exports = {ogimetIndexSet};
