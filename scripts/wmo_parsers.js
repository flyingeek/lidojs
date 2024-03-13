const {https} = require('follow-redirects');
const Papa = require('papaparse');

/* A copy of data files are stored in this gist to avoid temporary breakdown */
const gistURL = "https://gist.github.com/flyingeek/54caad59410a1f4641d480473ec824c3";

const parserPromise = (url, fn) => new Promise((resolve, reject) => {
  https.get(url, (response) => {
    let data = "";
    response.on("data", (chunk) => {
      data += chunk;
    });
    response.on("error", (err) => {
      reject(err);
    });
    response.on("end", () => {
      resolve(fn(data));
    });
  });
});

/**
 * Promise to wmo importer
 * Note: nsd_bbsss.txt is not updated since 2016
 *
 * @returns {Promise<Array>} [{wid<string>, name?<string>, longitude<float>, latitude<float>}]
 */
function wmoRequest(ogimetIds, url=`${gistURL}/raw/nsd_bbsss.txt`) {
  return parserPromise(url, data => {
    const parsed = Papa.parse(data);
    const results = [];
    const wids = [];
    const normalize = (v) => {
      const orientation = v.slice(-1);
      const sign = ('SW'.indexOf(orientation) >= 0) ? -1 : 1;
      let coords = ('NEWS'.indexOf(orientation) >=0) ? v.slice(0, -1) : v;
      coords += '-0-0'  // ensure missing seconds or minutes are 0
      const [degrees, minutes, seconds] = coords.split('-', 3).map(parseFloat);
      return sign * (degrees + (minutes / 60) + (seconds / 3600));
    };
    parsed.data.forEach((row) => {
      if (row.length < 8) return;
      const wid = row[0] + row[1];
      // wid, name, lon, lat
      wids.push(wid);
      if (ogimetIds.indexOf(wid) >= 0) {
        results.push({
          wid,
          "name": (row[2] === '----') ? '' : row[2],
          "longitude": normalize(row[8]),
          "latitude": normalize(row[7])
        });
      }
    });
    console.log(`${wids.length} wmo stations / ${results.length} known by ogimet`);
    return results;
  });
}

/**
 * Promise to vola importer
 * Note: vola_legacy_report.txt is not updated since 2021
 *
 * @returns {Promise<Array>} [{wid<string>, name?<string>, longitude<float>, latitude<float>}]
 */
function volaRequest(ogimetIds, url=`${gistURL}/raw/vola_legacy_report.txt`) {
  return parserPromise(url, data => {
    const parsed = Papa.parse(data);
    const results = [];
    const wids = [];
    const normalize = (v) => {
      const orientation = v.slice(-1);
      const sign = ('SW'.indexOf(orientation) >= 0) ? -1 : 1;
      let coords = ('NEWS'.indexOf(orientation) >=0) ? v.slice(0, -1) : v;
      coords += ' 0 0'  // ensure missing seconds or minutes are 0
      const [degrees, minutes, seconds] = coords.split(' ', 3).map(parseFloat);
      return sign * (degrees + (minutes / 60) + (seconds / 3600));
    };
    parsed.data.slice(1).forEach((row) => {
      if (row.length < 28) return;
      const wid = row[5];
      if (wid && wid.match(/^\d{5}$/u) && row[6] === "0") { /* some stations have subindex (1, 2...) defined in row[6] */
        if (wid !== "94907" && wids.indexOf(wid) >= 0) { // 94907 has a knwon duplicate
          console.log(`duplicate for ${wid}`);
        } else {
          wids.push(wid);
          if (ogimetIds.indexOf(wid) >= 0) {
            results.push({
              wid,
              "longitude": normalize(row[9]),
              "latitude": normalize(row[8])
            });
          }
        }
      }
    });
    console.log(`${wids.length} vola stations / ${results.length} known by ogimet`);
    return results;
  });
}

/**
 * Promise to oscar json importer
 * Note: Oscar is the current updated official database of WMO
 * URL: https://oscar.wmo.int/surface/rest/api/search/station?facilityType=landFixed&programAffiliation=GOSGeneral,RBON,GBON,RBSN,RBSNp,RBSNs,RBSNsp,RBSNst,RBSNt,ANTON,ANTONt&variable=216&variable=224&variable=227&variable=256&variable=310&variable=12000
 *
 * @returns {Promise<Array>} [{wid<string>, name?<string>, longitude<float>, latitude<float>}]
 */
function oscarRequest(ogimetIds, url=`${gistURL}/raw/oscar_wmo_stations.json`) {
  return parserPromise(url, data => {
    const wmo = JSON.parse(data).stationSearchResults;
    const results = [];
    const wids = [];
    wmo.forEach(w => {
      const wid = w.wigosId.split('-').pop();
      if (
        wid.match(/^\d{5}$/u)
        && w.wigosId.startsWith('0-20000-0-')
        && w.stationStatusCode === 'operational'
        && w.stationTypeName === 'Land (fixed)'
      ) {
        if (wids.indexOf(wid) >= 0) {
          console.log(`duplicate for ${wid}`);
        } else {
          wids.push(wid);
          if (ogimetIds.indexOf(wid) >= 0) {
            results.push({
              wid,
              "longitude": parseFloat(w.longitude),
              "latitude": parseFloat(w.latitude)
            });
          }
        }
      }
    });
    console.log(`${wids.length} oscar wmo stations / ${results.length} known by ogimet`);
    return results;
  });
}

/**
 * Merge importers
 */
async function wmoParser(ogimetIds, excludedStations) {
  const data = [];

  await Promise.all([volaRequest(ogimetIds), wmoRequest(ogimetIds), oscarRequest(ogimetIds)]).then(([volaData, wmoData, oscarData]) => {
    const addedWmoIds = [];
    for (const {wid, name, longitude, latitude} of wmoData) {
        if ((excludedStations.indexOf(wid) < 0) && (excludedStations.indexOf(name) < 0)) {
          addedWmoIds.push(wid);
          data.push([name || wid, latitude, longitude]);
        }
    }
    console.log(`wmo stations processed, total: ${data.length} WMO stations`);
    for (const {wid, longitude, latitude} of volaData) {
      if (excludedStations.indexOf(wid) < 0 && addedWmoIds.indexOf(wid) < 0) {
        addedWmoIds.push(wid);
        data.push([wid, latitude, longitude]);
      }
    }
    console.log(`vola stations processed, total: ${data.length} WMO stations`);
    for (const {wid, longitude, latitude} of oscarData) {
      if (excludedStations.indexOf(wid) < 0 && addedWmoIds.indexOf(wid) < 0) {
        addedWmoIds.push(wid);
        data.push([wid, latitude, longitude]);
      }
    }
    console.log(`oscar stations processed, total: ${data.length} WMO stations`);
  });
  return data;
}

module.exports = {wmoParser, parserPromise};
