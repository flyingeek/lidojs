/* eslint-disable no-sync */
/*eslint no-continue: 0*/
/* eslint max-lines-per-function: 0 */
const Geohash = require('ngeohash');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const {https} = require('follow-redirects');
const ogimetIds = require('./ogimet_idx.json');

const wmoPath = "./dist/wmo.json";
const wmoVarPath = "./dist/wmo.var.js";
const wmoURL = "https://gist.github.com/flyingeek/54caad59410a1f4641d480473ec824c3/raw/nsd_bbsss.txt";
const volaURL = "https://gist.github.com/flyingeek/54caad59410a1f4641d480473ec824c3/raw/vola_legacy_report.txt";
//const volaURL = "https://oscar.wmo.int/oscar/vola/vola_legacy_report.txt";
const volaJSONURL = "https://gist.githubusercontent.com/flyingeek/54caad59410a1f4641d480473ec824c3/raw/oscar_wmo_stations.json"
//const volaJSONURL = "https://oscar.wmo.int/surface/rest/api/search/station?facilityType=landFixed&programAffiliation=GOSGeneral,RBON,GBON,RBSN,RBSNp,RBSNs,RBSNsp,RBSNst,RBSNt,ANTON,ANTONt&variable=216&variable=224&variable=227&variable=256&variable=310&variable=12000";
const excludedStations = [];

console.log(`${excludedStations.length} excluded stations`);
console.log(`${ogimetIds.length} ogimet stations`);
console.log(`consider updating ogimet stations with npm run updateogimet`);

/**
 * Promise to oscar json importer
 */
function volaJSONRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = "";
      let wmo = [];
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("error", (err) => {
        reject(err);
      });
      response.on("end", () => {
        wmo = JSON.parse(data).stationSearchResults;
        const results = {};
        let counter = 0;
        let knownByOgimetCounter = 0;
        wmo.forEach(w => {
          const wid = w.wigosId.split('-').pop();
          if (
            wid.match(/^\d{5}$/u)
            && w.wigosId.startsWith('0-20000-0-')
          ) {
            counter += 1;
            if (ogimetIds.indexOf(wid) >= 0) {
              knownByOgimetCounter += 1;
              if (results[wid]) console.log(`doublon pour ${wid}`);
              results[wid] =[
                parseFloat(w.longitude),
                parseFloat(w.latitude),
                w.stationStatusCode
              ];
            }
          }
        });
        console.log(`${counter} oscar wmo stations / ${knownByOgimetCounter} known by ogimet`);
        resolve(results);
      });
    });
  });
}

/**
 * Promise to vola importer
 */
function volaRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("error", (err) => {
        reject(err);
      });
      response.on("end", () => {
        const parsed = Papa.parse(data);
        const results = {};
        const normalize = (v) => {
          const orientation = v.slice(-1);
          const sign = ('SW'.indexOf(orientation) >= 0) ? -1 : 1;
          let coords = ('NEWS'.indexOf(orientation) >=0) ? v.slice(0, -1) : v;
          coords += ' 0 0'  // ensure missing seconds or minutes are 0
          const [degrees, minutes, seconds] = coords.split(' ', 3).map(parseFloat);
          return sign * (degrees + (minutes / 60) + (seconds / 3600));
        };
        let counter = 0;
        let knownByOgimetCounter = 0;
        parsed.data.slice(1).forEach((row) => {
          if (row.length < 28) return;
          const wid = row[5];
          if (wid && wid.match(/^\d{5}$/u) && row[6] === "0") {
            if (results[wid]) {
              if (wid !== "94907") console.log(`doublon pour ${wid}`); //known doubles
            } else {
              counter += 1;
              if (ogimetIds.indexOf(wid) >= 0) {
                knownByOgimetCounter += 1;
                // wid: [lon, lat, remarks]
                results[wid] = [
                  normalize(row[9]),
                  normalize(row[8]),
                  row[28]//.split(", ")
                ]
              }
            }
          }
        });
        console.log(`${counter} vola stations / ${knownByOgimetCounter} known by ogimet`);
        resolve(results);
      })
    });
  });
}

/**
 * Promise to wmo importer
 */
function wmoRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("error", (err) => {
        reject(err);
      });
      response.on("end", () => {
        const parsed = Papa.parse(data);
        const results = [];
        const normalize = (v) => {
          const orientation = v.slice(-1);
          const sign = ('SW'.indexOf(orientation) >= 0) ? -1 : 1;
          let coords = ('NEWS'.indexOf(orientation) >=0) ? v.slice(0, -1) : v;
          coords += '-0-0'  // ensure missing seconds or minutes are 0
          const [degrees, minutes, seconds] = coords.split('-', 3).map(parseFloat);
          return sign * (degrees + (minutes / 60) + (seconds / 3600));
        };
        let counter = 0;
        let knownByOgimetCounter = 0;
        parsed.data.forEach((row) => {
          if (row.length < 8) return;
          const wid = row[0] + row[1];
          // wid, name, lon, lat
          counter += 1;
          if (ogimetIds.indexOf(wid) >= 0) {
            knownByOgimetCounter += 1;
            results.push([
              wid,
              (row[2] === '----') ? row[0] + row[1] : row[2],
              normalize(row[8]),
              normalize(row[7])
            ]);
          }
        });
        console.log(`${counter} wmo stations / ${knownByOgimetCounter} known by ogimet`);
        resolve(results);
      })
    });
  });
}

let counter = 0;

/**
 * Merge importers
 */
async function mergeData() {
  const data = {}
  const geohashPrecision = 3;

  /**
   * add a "point" in data results
   * @param {string} name
   * @param {number} latitude
   * @param {number} longitude
   */
  function addData(name, latitude, longitude) {
    const geohash = Geohash.encode(latitude, longitude, geohashPrecision);
    const value = [name, +latitude.toFixed(6), +longitude.toFixed(6)]
    if (geohash in data) {
        data[geohash].push(value);
    } else {
        data[geohash] = [value];
    }
    counter += 1;
  }

  await Promise.all([volaRequest(volaURL), wmoRequest(wmoURL), volaJSONRequest(volaJSONURL)]).then(([volaData, wmoData, oscarData]) => {
    const addedWmoIds = [];
    for (const [wid, name, lon, lat] of wmoData) {
        if ((excludedStations.indexOf(wid) >= 0) || (excludedStations.indexOf(name) >= 0)) continue;
        addedWmoIds.push(wid);
        addData(name, lat, lon);
    }
    console.log(`wmo stations processed, total: ${counter} WMO stations`);
    for (const [wid, [lon, lat, ]] of Object.entries(volaData)) {
      if (excludedStations.indexOf(wid) >= 0 || addedWmoIds.indexOf(wid) >= 0) continue;
      addedWmoIds.push(wid);
      addData(wid, lat, lon);
    }
    console.log(`vola stations processed, total: ${counter} WMO stations`);
    for (const [wid, [lon, lat, ]] of Object.entries(oscarData)) {
      if (excludedStations.indexOf(wid) >= 0 || addedWmoIds.indexOf(wid) >= 0) continue;
      addedWmoIds.push(wid);
      addData(wid, lat, lon);
    }
    console.log(`oscar stations processed, total: ${counter} WMO stations`);
  })
  return data;
}

fs.mkdirSync(path.dirname(wmoPath), {'recursive': true});

mergeData().then(data => {
  fs.writeFile(wmoPath, JSON.stringify(data), (err) => {
    if (err) {
      throw err;
    } else {
      console.log(`Saved ${counter} stations!`);
    }
  });
  // according to Google engineers, JSON.parse is faster than the native js parsing
  fs.writeFile(wmoVarPath, `var WMO=JSON.parse('${JSON.stringify(data)}');\n`, (err) => {
    if (err) {
      throw err;
    }
  });
});
