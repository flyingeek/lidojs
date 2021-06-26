/* eslint-disable no-sync */
/*eslint no-continue: 0*/
const Geohash = require('ngeohash');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const {https} = require('follow-redirects');

const wmoPath = "./dist/wmo.json";
const wmoVarPath = "./dist/wmo.var.js";
const wmoURL = "https://gist.github.com/flyingeek/54caad59410a1f4641d480473ec824c3/raw/nsd_bbsss.txt";
const volaURL = "https://gist.github.com/flyingeek/54caad59410a1f4641d480473ec824c3/raw/vola_legacy_report.txt";
//const volaURL = "https://oscar.wmo.int/oscar/vola/vola_legacy_report.txt";

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
        parsed.data.slice(1).forEach((row) => {
          if (row.length < 28) return;
          const wid = row[5];
          if (!wid) return;
          // wid: [lon, lat, remarks]
          results[wid] = [
            normalize(row[9]),
            normalize(row[8]),
            row[28].split(", ")
          ]
          counter += 1;
        });
        console.log(`${counter} vola stations`);
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
        parsed.data.forEach((row) => {
          if (row.length < 8) return;
          // wid, name, lon, lat
          results.push([
            row[0] + row[1],
            (row[2] === '----') ? row[0] + row[1] : row[2],
            normalize(row[8]),
            normalize(row[7])
          ]);
          counter += 1;
        });
        console.log(`${counter} wmo stations`);
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
  }

  await Promise.all([volaRequest(volaURL), wmoRequest(wmoURL)]).then(([volaData, wmoData]) => {
    const wmo = [];
    for (const [wid, name, lon, lat] of wmoData) {
      if (wid in volaData){
        const [volaLon, volaLat, remarks] = volaData[wid];
        if (['CYMT', 'LFBV'].indexOf(name) >= 0) continue;
        if (remarks.indexOf("GOS") < 0) continue;
        if (Math.abs(volaLon - lon) > 0.1 || Math.abs(volaLat - lat) > 0.1) {
          continue;
        }
        wmo.push(wid);
        addData(name, lat, lon);
        counter += 1;
      }
    }
    for (const [wid, [lon, lat, remarks]] of Object.entries(volaData)) {
      if ((wmo.indexOf(wid) < 0) && (['71822', '41298', '72232', '41284'].indexOf(wid) < 0) && (remarks.indexOf("GOS") >= 0)) {
        addData(wid, lat, lon);
        counter += 1;
      } else {
        //console.log(remarks);
      }
    }
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


