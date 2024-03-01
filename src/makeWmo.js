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
//const volaURL = "https://gist.github.com/flyingeek/54caad59410a1f4641d480473ec824c3/raw/vola_legacy_report.txt";
//const volaURL = "https://oscar.wmo.int/oscar/vola/vola_legacy_report.txt";
const volaJSONURL = "https://gist.githubusercontent.com/flyingeek/54caad59410a1f4641d480473ec824c3/raw/oscar_wmo_stations.json"
//const volaJSONURL = "https://oscar.wmo.int/surface/rest/api/search/station?facilityType=landFixed&programAffiliation=GOSGeneral,RBON,GBON,RBSN,RBSNp,RBSNs,RBSNsp,RBSNst,RBSNt,ANTON,ANTONt&variable=216&variable=224&variable=227&variable=256&variable=310&variable=12000";
const excludedStations = ['36874', '36894']; //['71822', '41298', '72232', '41284', '71944', '41248', '41274', '71872', '83032', '83075', '83249', '83581', '83742', '40280', 'LFPC', '04418', '81003', 'LIMT', '84378', '04282', '11336'];
//['71822', '72232', '71944', '83032', '83075', '83249', '83581', '83742', '40280', 'LFPC', '04418', '81003', 'LIMT', '84378', '04282', '11336']
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
        wmo.forEach(w => {
          const wid = w.wigosId.split('-').pop();
          if (
            wid.match(/^\d{5}$/u)
            && w.stationStatusCode === 'operational'
            && w.stationAssessedStatusCode === 'operational'
            && (w.stationProgramsDeclaredStatuses.indexOf('GOS')>=0 /* || w.stationProgramsDeclaredStatuses.indexOf('RBON:')>=0 || w.stationProgramsDeclaredStatuses.indexOf('GBON:')>=0*/)
          ) {
            results[wid] =[
              parseFloat(w.longitude),
              parseFloat(w.latitude),
              w.stationProgramsDeclaredStatuses
            ];
            counter += 1;
          }
        });
        console.log(`${counter} oscar wmo active stations`);
        resolve(results);
      });
    });
  });
}

/**
 * Promise to vola importer
 */
// function volaRequest(url) {
//   return new Promise((resolve, reject) => {
//     https.get(url, (response) => {
//       let data = "";
//       response.on("data", (chunk) => {
//         data += chunk;
//       });
//       response.on("error", (err) => {
//         reject(err);
//       });
//       response.on("end", () => {
//         const parsed = Papa.parse(data);
//         const results = {};
//         const normalize = (v) => {
//           const orientation = v.slice(-1);
//           const sign = ('SW'.indexOf(orientation) >= 0) ? -1 : 1;
//           let coords = ('NEWS'.indexOf(orientation) >=0) ? v.slice(0, -1) : v;
//           coords += ' 0 0'  // ensure missing seconds or minutes are 0
//           const [degrees, minutes, seconds] = coords.split(' ', 3).map(parseFloat);
//           return sign * (degrees + (minutes / 60) + (seconds / 3600));
//         };
//         let counter = 0;
//         parsed.data.slice(1).forEach((row) => {
//           if (row.length < 28) return;
//           const wid = row[5];
//           if (!wid) return;
//           // wid: [lon, lat, remarks]
//           results[wid] = [
//             normalize(row[9]),
//             normalize(row[8]),
//             row[28]//.split(", ")
//           ]
//           counter += 1;
//           //console.log({wid, "data": results[wid]});
//         });
//         console.log(`${counter} vola stations`);
//         resolve(results);
//       })
//     });
//   });
// }

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

  await Promise.all([volaJSONRequest(volaJSONURL), wmoRequest(wmoURL)]).then(([volaData, wmoData]) => {
    const wmoIds = [];
    for (const [wid, name, lon, lat] of wmoData) {
      if (wid in volaData && (excludedStations.indexOf(wid) < 0)){
        const [volaLon, volaLat, remarks] = volaData[wid];
        if (['CYMT', 'LFBV'].indexOf(name) >= 0) continue;
        if (remarks.indexOf("GOS") < 0) continue;
        if (Math.abs(volaLon - lon) > 0.1 || Math.abs(volaLat - lat) > 0.1) {
          continue;
        }
        wmoIds.push(wid);
        addData(name, lat, lon);
        counter += 1;
      }
    }
    for (const [wid, [lon, lat]] of Object.entries(volaData)) {
      if ((wmoIds.indexOf(wid) < 0) && (excludedStations.indexOf(wid) < 0)) {
        addData(wid, lat, lon);
        counter += 1;
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
