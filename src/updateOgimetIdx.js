const fs = require("fs");
const {https} = require('follow-redirects');
const Papa = require('papaparse');

/* CHECK TESTS AFTER UPDATING */
const outputPath = "./src/ogimet_idx.json";

/*
  returns date in the format YYYYMMDDHH00, the hours parameters indicates the offset in hour from now
*/
const beginParameter = (hours) => {
  const ts = Date.now() + (hours * 3600000);
  return (new Date(ts)).toISOString()
    .replace(/[^\d]+/gu,'')
    .slice(0,10) + "00";
}
const ogimetUrl = `https://www.ogimet.com/cgi-bin/getsynop?begin=${beginParameter(-12)}&lang=eng&header=yes`;

/**
  Process Ogimet SYNOP request and extract SYNOP IDs
*/
function ogimetRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = "";
      const stations = new Set();
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("error", (err) => {
        reject(err);
      });
      response.on("end", () => {
        const parsed = Papa.parse(data);
        parsed.data.slice(1).forEach((row) => {
          if (row[0].match(/^\d{5}$/u)) {
            stations.add(row[0]);
          }
        });
        resolve(stations);
      });
    });
  });
}
ogimetRequest(ogimetUrl).then(stations => {
    fs.writeFile(outputPath, JSON.stringify([...stations]), (err) => {
      if (err) {
        throw err;
      } else {
        console.log(`Saved ${stations.size} stations!`);
      }
  });
});
