/* eslint-disable max-lines-per-function */


const months3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 Dictionary of common OFP data:
 - flight (AF009)
 - departure (KJFK)
 - destination (LFPG)
 - datetime (a javascript Date object for scheduled departure block time)
 - date (OFP text date 25Apr2016)
 - datetime2 (a javascript Date object for scheduled arrival landing time)
 - ofp (OFP number 9/0/1)
 - alternates an array of alternate
 - ralts an array of route alternates (ETOPS)
 - taxitime (departure taxi time in mn)
 - rawfpl the raw text of the FPL
 * @param text The OFP in text format
 * @returns {{duration: number[], flight: string, datetime: Date, taxitime: number, destination: string, ofp: string, ralts: [], departure: string, alternates: [], rawfpl: string}}
 */
function ofpInfos(text) {
  let pattern = /(?<flight>AF\s+\S+\s+)(?<departure>\S{4})\/(?<destination>\S{4})\s+(?<datetime>\S+\/\S{4})z.*OFP\s+(?<ofp>\d+\S{0,8})/u;
  let match = pattern.exec(text);
  if (match === null) {
    pattern = /(?<flight>AF.+)(?<departure>\S{4})\/(?<destination>\S{4})\s+(?<datetime>\S+\/\S{4})z.*OFP\s+(?<ofp>\S+)Main/u;
    match = pattern.exec(text);
  }
  let {flight, departure, destination, datetime, ofp} = match.groups;
  // datetime is like 27Sep2019/1450
  const [date] = datetime.split('/', 1);
  const day = parseInt(datetime.substring(0,2), 10);
  const month = months3.indexOf(datetime.substring(2,5));
  const year = parseInt(datetime.substring(5,9), 10);
  const hours = parseInt(datetime.substring(10,12), 10);
  const minutes = parseInt(datetime.substring(12,14), 10);

  const rawFplText = text
    .extract("ATC FLIGHT PLAN", "TRACKSNAT")
    .extract("(", ")", false, true);

  pattern = new RegExp(String.raw`-${destination}(\d{4})\s`, "u");
  match = pattern.exec(rawFplText);
  let duration = [1, 0];
  if (match === null) {
    console.log("flight duration not found, arbitrary set to 1 hour");
  } else {
    duration = [
      parseInt(match[1].substring(0,2), 10),
      parseInt(match[1].substring(2,4), 10)
    ];
  }

  // try with 2 alternates first
  pattern = new RegExp(String.raw`-${destination}.+\s(\S{4})\s(\S{4})\s?[\n\-]`, "u");
  match = pattern.exec(rawFplText);
  let alternates = [];
  if (match !== null){
    alternates.push(match[1]);
    alternates.push(match[2]);
  } else {
     pattern = new RegExp(String.raw`-${destination}.+\s(\S{4})\s?[\n\-]`, "u");
     match = pattern.exec(rawFplText);
     if (match !== null) {
       alternates.push(match[1]);
     }
  }

  pattern = /RALT\/((?:\S{4}[ \n])+)/u;
  match = pattern.exec(rawFplText);
  let ralts = [];
  if (match !== null) {
    ralts.push(match[1].split(/\s/u));
  }

  const rawFS = text.extract("FLIGHT SUMMARY", "Generated");
  pattern = /\s(\d{2})(\d{2})\s+TAXI IN/u;
  match = pattern.exec(rawFS);
  let taxitime = 0;
  if (match === null) {
    console.log("taxitime not found, arbitrary set to 0");
  } else {
    taxitime = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }

  return {
    "flight": flight.replace(/\s/gu, ""),
    "departure": departure,
    "destination": destination,
    "datetime": new Date(Date.UTC(year, month, day, hours, minutes)),
    "datetime2": new Date(Date.UTC(year, month, day, hours + duration[0], minutes + duration[1] + taxitime)),
    "date": date,
    "ofp": ofp.replace("\xA9", ""),
    "duration": duration,
    "alternates": alternates,
    "ralts": ralts,
    "taxitime": taxitime,
    "rawfpl": rawFplText
  }
}
export {ofpInfos};
