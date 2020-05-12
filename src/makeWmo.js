/*eslint no-continue: 0*/
const Geohash = require('ngeohash');
const Papa = require('papaparse');
const fs = require('fs');
const https = require('https');

const wmoPath = "./src/modules/wmo.json";
const wmoURL = "https://raw.githubusercontent.com/flyingeek/editolido/gh-pages/ext-sources/nsd_bbsss.txt";
const volaURL = "https://raw.githubusercontent.com/flyingeek/editolido/gh-pages/ext-sources/vola_legacy_report.txt";

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
          const orientation = v[-1];
          const sign = ('SW'.indexOf(orientation) >= 0) ? -1 : 1;
          let coords = ('NEWS'.indexOf(orientation) >=0) ? v.slice(0, -1) : v;
          coords += ' 0 0'  // ensure missing seconds or minutes are 0
          const [degrees, minutes, seconds] = coords.split(' ', 3).map(parseFloat);
          return sign * (degrees + (minutes / 60) + (seconds / 3600));
        };
        parsed.data.forEach((row) => {
          if (row.length < 28) return;
          const wid = row[5];
          if (!wid) return;
          // wid: [lon, lat, remarks]
          results[wid] = [
            normalize(row[9]),
            normalize(row[8]),
            row[28].split(", ")
          ]
        });
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
          const orientation = v[-1];
          const sign = ('SW'.indexOf(orientation) >= 0) ? -1 : 1;
          let coords = ('NEWS'.indexOf(orientation) >=0) ? v.slice(0, -1) : v;
          coords += '-0-0'  // ensure missing seconds or minutes are 0
          const [degrees, minutes, seconds] = coords.split('-', 3).map(parseFloat);
          return sign * (degrees + (minutes / 60) + (seconds / 3600));
        };
        parsed.data.forEach((row) => {
          if (row.length < 8) return;
          // wid, name, lon, lat
          results.push([
            row[0] + row[1],
            (row[2] === '----') ? row[0] + row[1] : row[2],
            normalize(row[8]),
            normalize(row[7])
          ]);
        });
        resolve(results);
      })
    });
  });
}

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
        if (['CYMT'].indexOf(name) >= 0) continue;
        if (remarks.indexOf("GOS") < 0) continue;
        if (Math.round(volaLon, 1) !== Math.round(lon, 1) || Math.round(volaLat, 1) !== Math.round(lat, 1)) {
          continue;
        }
        wmo.push(wid);
        addData(name, lat, lon);
      }
    }
    for (const [wid, [lon, lat, remarks]] of Object.entries(volaData)) {
      if ((wid in wmo === false) && (wid in ['71822'] === false) && ("GOS" in remarks === false)) {
        addData(wid, lat, lon);
      }
    }
  })
  return data;
}

mergeData().then(data => {
  fs.writeFile(wmoPath, JSON.stringify(data), (err) => {
    if (err) {
      throw err;
    } else {
      console.log('Saved!');
    }
  });
});


