const Papa = require('papaparse');
const fs = require('fs');

try {
  // eslint-disable-next-line no-sync
    const data = fs.readFileSync('./src/wpts_oca.csv', 'utf8');
    const parsed = Papa.parse(data);
    const results = {};
    parsed.data.forEach(([name, lat, lon]) => {
      if (name && name !== "Name") {
        //console.log(`"${name}": [${lat}, ${lon}]`);
        results[name] = [
          parseFloat(lat.replace(",", ".")),
          parseFloat(lon.replace(",", "."))
        ];
      }
    });
    //console.log(JSON.stringify(results));
    fs.writeFile('./src/modules/fishpoints.json', JSON.stringify(results), (err) => {
      if (err) throw err;
      console.log('Saved!');
    });
} catch (e) {
    console.log('Error:', e.stack);
}

