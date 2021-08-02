/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */

import {GeoPoint} from './geopoint';
const AIRPORTS = require('./airports');

const months3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 Dictionary of common OFP data:
 - flight (AF009)
 - departure (KJFK)
 - dep3 IATA departure (JFK)
 - destination (LFPG)
 - des3 IATA destination (CDG)
 - datetime (a javascript Date object for scheduled departure block time)
 - STD is an alias for datetime
 - date (OFP text date 25Apr2016)
 - datetime2 (a javascript Date object for estimated arrival block time)
 - STA (a javascript Date object for scheduled arrival block time)
 - duration [hours, minutes] hours and minutes are Number
 - ofp (OFP number 9/0/1)
 - alternates an array of alternate
 - ralts an array of route alternates (ETOPS)
 - taxitime (departure taxi time in mn)
 - taxitime2 (arrival taxi time in mn)
 - rawfpl the raw text of the FPL
 - EEP the  ETOPS entry GeoPoint
 - EXP the ETOPS exit GeoPoint
 - raltPoints the ETOPS airports as GeoPoint
 - ETOPS the ETOPS time in minutes
 - fl average flight level or 300
 - levels = array of flight levels found in FPL or [300]
 - payload
 - tripFuel
 - blockFuel
 * @param text The OFP in text format
 * @returns {{duration: number[], flight: string, datetime: Date, taxitime: number, destination: string, ofp: string, ralts: [], departure: string, alternates: [], rawfpl: string, dep3: string, des3: string, tripFuel: number, blockFuel: number, payload: number}}
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
  const scheduledDeparture = new Date(Date.UTC(year, month, day, hours, minutes));

  const rawFplText = text
    .extract("ATC FLIGHT PLAN", "TRACKSNAT")
    .extract("(", ")", false, true);

  let duration = [1, 0];
  pattern = new RegExp(String.raw`(?:-TRIP|SUMMARYTRIP)\s+[0-9]+[\s.]+([0-9]{4})\s`, "u");
  match = pattern.exec(text);
  if (match === null){
    pattern = new RegExp(String.raw`-${destination}(\d{4})\s`, "u");
    match = pattern.exec(rawFplText);
    duration = [1, 0];
    if (match === null) {
      console.log("flight duration not found, arbitrary set to 1 hour");
    } else {
      console.log("trip time not found, using fpl flight time");
    }
  }
  duration = [
    parseInt(match[1].substring(0,2), 10),
    parseInt(match[1].substring(2,4), 10)
  ];


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
    ralts = match[1].trim().split(/\s/u);
  }

  let levels = [...rawFplText.matchAll(/F(\d{3})\s/ug)].map(v => (v[1]*1));
  let fl = 300;
  if (levels && levels.length) {
      fl = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
  } else {
    levels = [fl];
  }
  const rawFS = text.extract("FLIGHT SUMMARY", "Generated");
  pattern = /\s(\d{2})(\d{2})\s+TAXI IN/u;
  match = pattern.exec(rawFS);
  let taxitime = 15;
  if (match === null) {
    console.log("taxitime not found, arbitrary set to 15mn");
  } else {
    taxitime = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  let taxitime2= 15;
  pattern = /\/\s+(\d{2})(\d{2})MIN/u;
  match = pattern.exec(rawFS);
  if (match === null) {
    console.log("arrival taxitime not found, arbitrary set to 15mn");
  } else {
    taxitime2 = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  pattern = new RegExp(String.raw`\s${destination}/([A-Z]{3})\s\d{4}`, "u");
  match = pattern.exec(rawFS);
  const des3 = (match) ? match[1] : '';
  pattern = new RegExp(String.raw`\s${departure}/([A-Z]{3})\s\d{4}`, "u");
  match = pattern.exec(rawFS);
  const dep3 = (match) ? match[1] : '';
  pattern = /\.PLD\s+(\d+)\s/u;
  match = pattern.exec(rawFS);
  const pld = (match) ? parseInt(match[1], 10) : 0;
  pattern = /\.BLOCK\s+(\d+)\s/u;
  match = pattern.exec(rawFS);
  const blockFuel = (match) ? parseInt(match[1], 10) : 0;
  pattern = /\|TRIP\s+(\d+)\s/u;
  match = pattern.exec(rawFS);
  const tripFuel = (match) ? parseInt(match[1], 10) : 0;
  pattern = /\s+STA\s+([0-9]{4})/u;
  match = pattern.exec(rawFS);
  let station = (match) ? new Date(Date.UTC(year, month, day, parseInt(match[1].slice(0,2), 10), parseInt(match[1].slice(2), 10))): null;
  if (station && station < scheduledDeparture) {
    station = new Date(Date.UTC(year, month, day + 1, parseInt(match[1].slice(0,2), 10), parseInt(match[1].slice(2), 10)));
  }
  //aircraft type
  let aircraft = "???";
  const aircraftTypes = { // convert to Oliver Ravet codes
    'A388': '380',
    'B772': '772',
    'B773': '773',
    'B77W': '773',
    'B77L': '77F',
    'B788': '787',
    'B789': '787',
    'B78X': '787',
    'A318': '318',
    'A319': '319',
    'A320': '320',
    'A321': '321',
    'A332': '330',
    'A333': '330',
    'A338': '330',
    'A339': '330',
    'A342': '340',
    'A343': '340',
    'A344': '340',
    'A345': '340',
    'A346': '340',
    'A359': '350',
    'A35K': '350'
  }
  pattern = /-([AB][0-9]{2}.)\//u
  match = pattern.exec(rawFplText);
  if (match) {
      aircraft = aircraftTypes[match[1]] || '???';
  }
  // aircraft registration
  let registration = '';
  pattern = /REG\/(\S+)/u
  match = pattern.exec(rawFplText);
  if (match) {
      registration = match[1][0] + '-' + match[1].slice(1);
  }
  // icao24
  let icao24 = '';
  pattern = /CODE\/(\S+)/u
  match = pattern.exec(rawFplText);
  if (match) {
    icao24 = match[1];
  }
  // eslint-disable-next-line init-declarations
  let exp;
  // eslint-disable-next-line init-declarations
  let eep;
  let etopsTime = 0;
  if (ralts.length > 0) {
      pattern = /ETOPS\s+(\d{3})\s/u
      match = pattern.exec(rawFS);
      if (match) {
        etopsTime = parseInt(match[1], 10);
      } else {
        try {
          match = pattern.exec(text.extract('FPL SUMMARY', 'Generated'));
          if (match) {
            etopsTime = parseInt(match[1], 10);
          }
        } catch (err) {
          console.log("ETOPS range not found");
        }
      }
      const etopsSummary = text.extract("ETOPS SUMMARY", "Generated");
      pattern = /EEP\((\S{4})\)/u;
      match = pattern.exec(etopsSummary);
      if (match) {
        eep = match[1];
      }
      pattern = /EXP\((\S{4})\)/u;
      match = pattern.exec(etopsSummary);
      if (match) {
        exp = match[1];
      }
  }
  const infos = {
    "flight": flight.replace(/\s/gu, ""),
    "departure": departure,
    "destination": destination,
    "datetime": scheduledDeparture,
    "STD": scheduledDeparture,
    "takeoff": new Date(Date.UTC(year, month, day, hours , minutes + taxitime)),
    "landing": new Date(Date.UTC(year, month, day, hours + duration[0], minutes + duration[1] + taxitime)),
    station,
    "STA": station,
    "datetime2": new Date(Date.UTC(year, month, day, hours + duration[0], minutes + duration[1] + taxitime + taxitime2)),
    "date": date,
    "ofp": ofp.replace("\xA9", ""),
    "duration": duration,
    "alternates": alternates,
    "ralts": ralts,
    "raltPoints": [],
    "taxitime": taxitime,
    "taxitime2": taxitime2,
    "rawfpl": rawFplText,
    aircraft,
    registration,
    icao24,
    "EEP": null,
    "EXP": null,
    "ETOPS": etopsTime,
    fl,
    levels,
    dep3,
    des3,
    "payload": pld / 1000,
    "tripFuel": tripFuel / 1000,
    "blockFuel": blockFuel / 1000
  }
  try {
    infos['raltPoints'] = [];
    for (const v of ralts) {
      if (v && AIRPORTS[v]) {
        infos['raltPoints'].push(new GeoPoint(AIRPORTS[v], {'name': v, 'description': 'ETOPS'}));
      } else {
        console.error('missing airport', v);
      }
    }
    if (eep && AIRPORTS[eep]) {
      infos['EEP'] = new GeoPoint(AIRPORTS[eep], {'name': eep, 'description': 'EEP'});
    } else if (eep){
      console.error('missing airport', eep);
    }
    if (exp && AIRPORTS[exp]) {
      infos['EXP'] = new GeoPoint(AIRPORTS[exp], {'name': exp, 'description': 'EXP'});
    } else if (exp){
      console.error('missing airport', exp);
    }
  } catch (err) {
    console.log(err);
  }
  return infos
}
export {ofpInfos};
