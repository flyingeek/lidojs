/* eslint-disable max-lines */
/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */

import {getFlightTypePNT, parseDuties} from './pairing';
import {iata2tz, icao2iata} from './iata2icao';
import {GeoPoint} from './geopoint';
import {StringExtractException} from "./ofp_extensions";
const AIRPORTS = require('./airports');

const months3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 Dictionary of common OFP data:
 - flightNo (AF009)
 - callsign (AFR009)
 - depICAO (KJFK)
 - depIATA IATA departure (JFK)
 - destICAO (LFPG)
 - destIATA IATA destination (CDG)
 - taxiTimeIN (departure taxi time in minutes)
 - taxiTimeOUT (arrival taxi time in minutes)
 - flightTime (ofp flight time in minutes)
 - ofpOUT (a javascript Date object for scheduled departure block time)
 - ofpOFF (ofpOUT + taxiTimeOUT)
 - ofpON (ofpOUT + taxiTimeOUT + flightTime)
 - ofpIN (ofpOUT + taxiTimeOUT + flightTime + taxiTimeIN)
 - scheduledIN (a javascript Date object for scheduled arrival block time)
 - ofp (OFP number 9/0/1)
 - alternates an array of alternate names
 - ralts an array of route alternate names (ETOPS)
 - rawFPL the raw text of the FPL
 - EEP the airport related to the ETOPS entry GeoPoint
 - EXP the airport related to the ETOPS exit GeoPoint
 - raltPoints the ETOPS airports as GeoPoint
 - maxETOPS the ETOPS time in minutes
 - minFuelMarginETOPS minimum fuel margin in T (extracted from ETOPS SUMMARY)
 - averageFL average flight level or 300
 - levels = array of flight levels found in FPL or [300]
 - payload in T
 - tripFuel in T
 - blockFuel in T
 - inFlightReleased is true when the OFP is released while in flight
 - inFlightStart is the start point name for ofp released in flight
 * @param text The OFP in text format
 * @returns {{flightNo: string, callsign: string, depICAO: string, depIATA: string, destICAO: string, destIATA: string, taxiTimeOUT: number, taxiTimeIN: number, ofpOUT: Date, ofpOFF: Date, ofpON: Date, ofpIN: Date, scheduledIN: Date, ofp: string, ralts: [] alternates: [], rawFPL: string, EEP: GeoPoint, EXP: GeoPoint, raltPoints: [GeoPoint], maxETOPS: number, fl: number, levels: [number], tripFuel: number, blockFuel: number, payload: number, inFlightReleased: boolean, inFlightStart: string, flightTypeAircraft: string, aircraftType: string}}
 */
function ofpInfos(text) {
  let pattern = /(?<flight>AF\s+\S+\s+)(?<depICAO>\S{4})\/(?<destICAO>\S{4})\s+(?<datetime>\S+\/\S{4})z.*OFP\s+(?<ofp>\d+\S{0,8})/u;
  let match = pattern.exec(text);
  if (match === null) {
    pattern = /(?<flight>AF.+)(?<depICAO>\S{4})\/(?<destICAO>\S{4})\s+(?<datetime>\S+\/\S{4})z.*OFP\s+(?<ofp>\S+)Main/u;
    match = pattern.exec(text);
  }
  let {flight, depICAO, destICAO, datetime, ofp} = match.groups;
  // datetime is like 27Sep2019/1450
  const [ofpTextDate] = datetime.split('/', 1);
  const day = parseInt(datetime.substring(0,2), 10);
  const month = months3.indexOf(datetime.substring(2,5));
  const year = parseInt(datetime.substring(5,9), 10);
  const hours = parseInt(datetime.substring(10,12), 10);
  const minutes = parseInt(datetime.substring(12,14), 10);
  const ofpOUT = new Date(Date.UTC(year, month, day, hours, minutes));
  const inFlightReleased = text.indexOf("Inflight Released") >= 0;

  const rawFPL = text
    .extract("ATC FLIGHT PLAN", "TRACKSNAT")
    .extract("(", ")", false, true);
  const flightNo = flight.replace(/\s/gu, "");
  let callsign = flightNo;
  pattern = /\(FPL-([^-]+)-/u
  match = pattern.exec(rawFPL);
  if (match) {
      callsign = match[1];
  }

  pattern = new RegExp(String.raw`(?:-TRIP|SUMMARYTRIP)\s+[0-9]+[\s.]+(\d{2})(\d{2})\s`, "u");
  match = pattern.exec(text);
  if (match === null){
    pattern = new RegExp(String.raw`-${destICAO}(\d{2})(\d{2})\s`, "u");
    match = pattern.exec(rawFPL);
    if (match === null) {
      console.log("flight duration not found, arbitrary set to 1 hour");
    } else {
      console.log("trip time not found, using fpl flight time");
    }
  }
  const flightTime = (match) ? parseInt(match[2], 10) + 60 * parseInt(match[1], 10) : 60;

  // try with 2 alternates first
  pattern = new RegExp(String.raw`-${destICAO}.+\s(\S{4})\s(\S{4})\s?[\n\-]`, "u");
  match = pattern.exec(rawFPL);
  let alternates = [];
  if (match !== null){
    alternates.push(match[1]);
    alternates.push(match[2]);
  } else {
    pattern = new RegExp(String.raw`-${destICAO}.+\s(\S{4})\s?[\n\-]`, "u");
    match = pattern.exec(rawFPL);
    if (match !== null) {
      alternates.push(match[1]);
    }
  }

  pattern = /RALT\/((?:\S{4}[ \n])+)/u;
  match = pattern.exec(rawFPL);
  let ralts = [];
  if (match !== null) {
    ralts = match[1].trim().split(/\s/u);
  }

  let levels = [...rawFPL.matchAll(/F(\d{3})\s/ug)].map(v => (v[1]*1));
  let averageFL = 300;
  if (levels && levels.length) {
      averageFL = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
  } else {
    levels = [averageFL];
  }
  const rawFS = text.extract("FLIGHT SUMMARY", "Generated");
  // eslint-disable-next-line init-declarations
  let inFlightStart;
  // eslint-disable-next-line init-declarations
  let InFlightStartETO;
  if (inFlightReleased) {
    pattern = new RegExp(String.raw`ATC:${callsign}\s+(\S+)\s+\d{4}\s+\.{4}\s+(\d{2})(\d{2})`, "u");
    match = pattern.exec(rawFS);
    if (match) {
      inFlightStart = match[1];
      InFlightStartETO = new Date(Date.UTC(year, month, day, parseInt(match[2], 10), parseInt(match[3], 10)))
    }
  }
  pattern = /\s(\d{2})(\d{2})\s+TAXI IN/u;
  match = pattern.exec(rawFS);
  let taxiTimeOUT = 15;
  if (match === null) {
    console.log("taxiTimeOUT not found, arbitrary set to 15mn");
  } else {
    taxiTimeOUT = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  let taxiTimeIN= 15;
  pattern = /\/\s+(\d{2})(\d{2})MIN/u;
  match = pattern.exec(rawFS);
  if (match === null) {
    console.log("arrival taxitime not found, arbitrary set to 15mn");
  } else {
    taxiTimeIN = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  pattern = new RegExp(String.raw`\s${destICAO}/([A-Z]{3})\s\d{4}`, "u");
  match = pattern.exec(rawFS);
  const destIATA = (match) ? match[1] : '';
  pattern = new RegExp(String.raw`\s${depICAO}/([A-Z]{3})\s\d{4}`, "u");
  match = pattern.exec(rawFS);
  const depIATA = (match) ? match[1] : icao2iata(depICAO);
  pattern = /\.PLD\s+(\d+)\s/u;
  match = pattern.exec(rawFS);
  const pld = (match) ? parseInt(match[1], 10) : 0;
  pattern = /\.BLOCK\s+(\d+)\s/u;
  match = pattern.exec(rawFS);
  const blockFuel = (match) ? parseInt(match[1], 10) : 0;
  pattern = /\|TRIP\s+(\d+)\s/u;
  match = pattern.exec(rawFS);
  const tripFuel = (match) ? parseInt(match[1], 10) : 0;
  pattern = new RegExp(String.raw`GND DIST\s+(\d+)${ofpTextDate.toUpperCase().substring(0,5)}`, "u");
  match = pattern.exec(rawFS);
  const groundDistance = (match) ? parseInt(match[1], 10) : 0;
  pattern = /\s+STA\s+([0-9]{4})/u;
  match = pattern.exec(rawFS);
  let scheduledIN = (match) ? new Date(Date.UTC(year, month, day, parseInt(match[1].slice(0,2), 10), parseInt(match[1].slice(2), 10))): null;
  if (scheduledIN && scheduledIN < ofpOUT) {
    scheduledIN = new Date(Date.UTC(year, month, day + 1, parseInt(match[1].slice(0,2), 10), parseInt(match[1].slice(2), 10)));
  }
  //aircraft type
  let aircraftType = "???";
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
    'A20N': '320', //A320 neo
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
    'A35K': '350',
    'BCS1': '220',
    'BCS3': '220'
  }
  pattern = /-([AB][0-9]{2}.|BCS\d)\//u
  match = pattern.exec(rawFPL);
  if (match) {
      aircraftType = aircraftTypes[match[1]] || '???';
  }
  const flightTypeAircraft = (['220', '318', '319', '320', '321'].includes(aircraftType)) ? "MC" : "LC";
  // aircraft registration
  let aircraftRegistration = '';
  pattern = /REG\/(\S+)/u
  match = pattern.exec(rawFPL);
  if (match) {
      aircraftRegistration = match[1][0] + '-' + match[1].slice(1);
  }
  // icao24
  let aircraftICAO24 = '';
  pattern = /CODE\/(\S+)/u
  match = pattern.exec(rawFPL);
  if (match) {
    aircraftICAO24 = match[1];
  }
  // eslint-disable-next-line init-declarations
  let exp;
  // eslint-disable-next-line init-declarations
  let eep;
  // eslint-disable-next-line init-declarations
  let minFuelMarginETOPS;
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
      const etopsSummary = text.extract("ETOPS SUMMARY", "--FLIGHT LOG");
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
      pattern = /ETO\.{4}\s+([\d.]+)\/EFOB\s([\d.]+)/gu;
      minFuelMarginETOPS = Math.min(...Array.from(etopsSummary.matchAll(pattern), m => parseFloat(m[2]) - parseFloat(m[1])));
  }

  const ofpOFF = (!InFlightStartETO) ? new Date(ofpOUT.getTime() + taxiTimeOUT * 60000) : InFlightStartETO;
  const ofpON = new Date(ofpOFF.getTime() + flightTime * 60000);
  const ofpIN = new Date(ofpON.getTime() + taxiTimeIN * 60000);
  const tzdb = {};
  let flightTypePNT = null;
  try {
      const pairingText = text.extract('CREW PAIRING', 'Generated');
      pattern = /DATE\s:\s(\d+)\.(\S{3})\.(\d{4})/u;
      match = pattern.exec(pairingText);
      if (match) {
          const y = parseInt(match[3], 10);
          const m = months3.indexOf(match[2]) + 1; // 1-12
          if (m <= 0) throw new Error('could not extract pairing month');
          const duties = parseDuties(pairingText, y, m);
          flightTypePNT = getFlightTypePNT(duties);
          for (const duty of duties) {
            if (duty.legs && duty.legs.length > 0) {
              const iata = duty.legs[0].depIATA;
              tzdb[iata] = iata2tz(iata);
            }
          }
      } else {
          throw new Error('could not extract pairing month/year');
      }
  } catch (err) {
      if (!(err instanceof StringExtractException)) {
          console.error(err);
      }
  }
  const infos = {
    //"flight": flightNo, /*deprecated */
    flightNo,
    callsign,

    //"departure": depICAO, /*deprecated */
    //"dep3": depIATA, /*deprecated */
    "depICAO": depICAO,
    "depIATA": depIATA,

    //"destination": destICAO, /*deprecated */
    //"des3": destIATA, /*deprecated */
    "destICAO": destICAO,
    "destIATA": destIATA,

    //"datetime": ofpOUT, /*deprecated */
    //"STD": ofpOUT, /*deprecated */
    //"takeoff": ofpOFF, /*deprecated */
    //"landing": ofpON, /*deprecated */
    //"station": scheduledIN, /*deprecated */
    //"STA": scheduledIN, /*deprecated */
    //"datetime2": ofpIN, /*deprecated */
    ofpOUT,
    ofpOFF,
    ofpON,
    ofpIN,
    scheduledIN,
    "flightTime": (ofpON.getTime() - ofpOFF.getTime()) / 60000,
    "blockTime": (ofpIN.getTime() - ofpOUT.getTime()) / 60000,
    "scheduledBlockTime": (scheduledIN) ? (scheduledIN.getTime() - ofpOUT.getTime()) / 60000 : 0,
    //"date": ofpTextDate, /* deprecated */
    ofpTextDate,
    "ofp": ofp.replace("\xA9", ""),
    //"duration": duration,  /*deprecated */
    "alternates": alternates,
    "ralts": ralts,
    "raltPoints": [],
    //"taxitime": taxiTimeOUT, /*deprecated */
    //"taxitime2": taxiTimeIN, /*deprecated */
    taxiTimeOUT,
    taxiTimeIN,
    //"rawfpl": rawFPL,/*deprecated */
    rawFPL,
    //"aircraft": aircraftType,  /*deprecated */
    aircraftType,
    flightTypeAircraft,
    //"registration": aircraftRegistration,  /*deprecated */
    aircraftRegistration,
    //"icao24": aircraftICAO24,  /*deprecated */
    aircraftICAO24,
    "EEP": null,
    "EXP": null,
    //"ETOPS": etopsTime,  /*deprecated */
    "maxETOPS": etopsTime,
    minFuelMarginETOPS,
    averageFL,
    levels,
    "payload": pld / 1000,
    "tripFuel": tripFuel / 1000,
    "blockFuel": blockFuel / 1000,
    groundDistance,
    inFlightReleased,
    inFlightStart,
    flightTypePNT,
    tzdb
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
export {ofpInfos, months3};
