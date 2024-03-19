const fs = require("fs");
const {ogimetIndexSet} = require('./ogimet_lib');
const previousOgimetIds = require('./ogimet_idx.json');

const outputPath = "./scripts/ogimet_idx.json";

// We fetch the SYNOPS on a 36 hours period, those index SHOULD be recognized by Ogimet (but not really...)

ogimetIndexSet(true).then(stationSet => {
  const difference = (setA, setB) => {
      let diff = new Set(setA);
      for (let elem of setB) {
        diff.delete(elem);
      }
      return diff;
  }
  const previousSet = new Set(previousOgimetIds);
  fs.writeFile(outputPath, JSON.stringify([...stationSet]), (err) => {
    if (err) {
      throw err;
    } else {
      console.log(`Saved ${stationSet.size} stations!`);
    }
  });
  console.log(`${[...difference(stationSet, previousSet)].length} stations added`);
  console.log(`removed: ${[...difference(previousSet, stationSet)]}`);
});
