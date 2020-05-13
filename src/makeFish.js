const Papa = require('papaparse');
const fs = require('fs');
const {https} = require('follow-redirects');

const fishPath = "./src/modules/fishpoints.json";
const gistURL = "https://gist.githubusercontent.com/flyingeek/03083c65997e02b65664fb6796fdcf41/raw/wpts_oca.csv";

https.get(gistURL, (response) => {
  let data = "";
  response.on("data", (chunk) => {
    data += chunk;
  });
  response.on("end", () => {
    const parsed = Papa.parse(data);
    const results = {};
    let counter = 0;
    parsed.data.forEach(([name, lat, lon]) => {
      if (name && name !== "Name") {
        //console.log(`"${name}": [${lat}, ${lon}]`);
        results[name] = [
          +parseFloat(lat.replace(",", ".")).toFixed(6),
          +parseFloat(lon.replace(",", ".")).toFixed(6)
        ];
        counter += 1;
      }
    });
    fs.writeFile(fishPath, JSON.stringify(results), (err) => {
      if (err) {
        throw err;
      } else {
        console.log(`Saved ${counter} fishpoints!`);
      }
    });
  })
});


