/* eslint-disable no-underscore-dangle,max-lines-per-function, max-lines */

import {GeoPoint, arinc_normalizer, dm_normalizer} from "./geopoint";
import {Route, Track} from "./route";

/**
 * Exception thrown when a search term is not found
 */
class StringExtractException extends Error {}

/**
 * Defines an extract method on the String prototype
 * Extract text between start and end mark
 * @param text: String
 * @param start: String
 * @param end: String
 * @param endIsOptional: if end is missing, captures till EOF
 * @param inclusive: if true, captures start and end
 * @return String
 */
Reflect.defineProperty(String.prototype, 'extract', {
  value(start, end, endIsOptional = true, inclusive = false) {
    let from = 0;
    let to = 0;
    if (start) {
      from = this.indexOf(start);
      if (from === -1) {
        throw new StringExtractException(`${start} not found`);
      }
      if (!inclusive) {
        from += start.length;
      }
    }
    if (!end) {
      return this.substring(from);
    }
    to = this.indexOf(end, from);
    if (to === -1) {
      if (endIsOptional) {
        return this.substring(from);
      }
      throw new StringExtractException(`${end} not found`);
    } else if (inclusive) {
      to += end.length;
    }
    return this.substring(from, to);
  }
});

const pdfParser = Object.freeze({
  "pypdf2": 3,
  "pdfjs": 4
});

const ofpType = Object.freeze({
  "S4": 1,
  "NVP": 2
});

const months3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FISHPOINTS = require('./fishpoints');

/**
 * A matchAll RegExp to extract WPT COORDINATES from text
 * @return {GeoPoint[]}
 */
class WptRegExp extends RegExp {

  /**
   * matchAll methods to return an array of GeoPoint
   * @param str
   * @returns {GeoPoint[]}
   */
  [Symbol.matchAll](str) {
    // eslint-disable-next-line prefer-reflect
    let result = RegExp.prototype[Symbol.matchAll].call(this, str);
    if (!result) {
      console.error("WPT Coordinates regexp failed");
      return [];
    }
    let geoPoints = [];
    Array.from(result).forEach((match) => {
      let name = match[1].trim().replace(/^-+/u, "");
      if (name === "") {
        name = match[2] + match[3];
      }
      geoPoints.push(
        new GeoPoint(
          [match[2], match[3]],
          {"name": name, "normalizer": dm_normalizer})
      );
    });
    return geoPoints;
  }
}
const wptRegExp = new WptRegExp(String.raw`(\S+|\s+)\s+([NS]\d{4}\.\d)([EW]\d{5}\.\d)`, 'gu');

/**
 Dictionnary of common OFP data:
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
 * @param text The OFP in text format
 * @returns {{duration: number[], flight: string, datetime: Date, taxitime: number, destination: string, ofp: string, ralts: [], departure: string, alternates: [], rawFplText: string}}
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
    "rawFplText": rawFplText
  }
}


export class Ofp {
  constructor(text="") {
    console.assert(text.startsWith("_PDFJS_"), "invalid text file");
    this.text = text;
    this.pdfParser = pdfParser.pdfjs;
    this.ofpType = ofpType.S4;
    if (text.includes("--FLIGHT SUMMARY--")) {
      this.ofpType = ofpType.NVP;
    }

    try {
      this.infos = ofpInfos(text);
    } catch (error) {
      console.error(error);
      try {
        if (window) {
          // eslint-disable-next-line no-alert
          window.alert(`Erreur: {error}` )
        }
      } catch (exception) {
        // not in browser, just log
      }
      throw error;
    }

    /**
     * Memoize a result
     * Note: this is in constructor as we need to have haccess
     * to the "this" of the function to create the store.
     * @param name: the cache keyname
     * @param fn: the function to execute (no parameters allowed)
     * @returns {*}
     */
    this.cache = function(name, fn) {
      // eslint-disable-next-line consistent-this,no-invalid-this
      const thisFunction = this;
      if (!thisFunction.store) {
        thisFunction.store = {}; /* on first run create cache storage */
      }
      if (thisFunction.store[name] === undefined) {
        thisFunction.store[name] = fn();
      }
      return thisFunction.store[name];
    };
  }

  get description() {
    const infos = this.infos;
    return `${infos.flight} ${infos.departure}-${infos.destination} ${infos.date} " "${infos.datetime.toISOString().substring(11,16)}z OFP ${infos.ofp}`;
  }

  /**
   * Array of WPT COORDINATES found in OFP
   * @param start the text marker for start (useful for tests)
   * @param end the end marker for end (useful for tests)
   * @returns {GeoPoint[]}
   */
  wptCoordinates(start="", end="") {
    const infos = this.infos;
    let extract = ((start === "") ? `${infos.departure}  N` : "") + this.text.extract(
      (start === "") ? `----${infos.departure}  N` : start,
      (end === "") ? "Generated" : end
    );
    // noinspection JSValidateTypes
    return extract.matchAll(wptRegExp);
  }

  /**
   * Array of WPT COORDINATES for alternate found in OFP
   * @param start the text marker for start (useful for tests)
   * @param end the end marker for end (useful for tests)
   * @returns {GeoPoint[]}
   */
  wptCoordinatesAlternate(start="", end="") {
    const infos = this.infos;
    let extract = ((start === "") ? `${infos.destination}  N` : "") + this.text.extract(
      (start === "") ? `----${infos.destination}  N` : start,
      (end === "") ? "--WIND" : end
    );
    // noinspection JSValidateTypes
    return extract.matchAll(wptRegExp);
  }

  /**
   * return the label designating the track in the FPL
   * @param letter
   * @returns {string}
   */
  static fplTrackLabel(letter) {
    return `NAT${letter}`;
  }

  /**
   * check if the designated track is in the FPL
   * @param letter
   * @returns {boolean}
   */
  isMyTrack(letter) {
    return this.fplRoute.indexOf(Ofp.fplTrackLabel(letter)) !== -1;
  }

  /**
   * Parse the OFP and return tracks as an array of [trackLetter, trackDescription]
   * @returns {[]}
   */
  trackParser() {
    let extract = this.text
      .extract("TRACKSNAT", "NOTES:");
    let results = [];
    if (extract.includes("REMARKS:")) {
      extract = extract.split("REMARKS:", 1)[0];
      extract = extract.split("Generated at", 1)[0];
    }
    if (extract.includes(" LVLS ")) {
      // split at track letter, discard first part
      const a = extract.split(/(?:\s|[^A-Z\d])([A-Z])\s{3}/gu).slice(1);
      // results are [trackLetter, trackDescription]
      for (let i = 0, max = a.length; i < max; i += 2) {
        results.push([a[i], a[i + 1]]);
      }
    } else {
      console.error("Unknown TRACKSNAT message format");
    }
    return results;
  }

  /**
   * Tracks found in the OFP as an array of Track
   * @returns {Track[]}
   */
  tracks() {
    let parserResults = this.trackParser();
    const pattern = /(\d{2,4}[NS]\d{3,5}[EW]|[NESW]\d{4}|\d[NESW]\d{3}[^EW])/u;
    let fishPoints = {};
    let tracks = [];

    //find unknows named waypoints in tracks
    let unknowns = [];
    // eslint-disable-next-line array-callback-return
    parserResults.map(([, description]) => {
      description.split(" LVLS ", 1)[0].split(" ").forEach((p) => {
        const label = p.trim();
        if (label !== "") {
          if (pattern.exec(label) === null) {
            unknowns.push(label);
          }
        }
      });
    });
    // console.debug(`Unknown track points: ${unknowns}`);
    unknowns.forEach((name) => {
      const f = FISHPOINTS[name];
      if (f !== undefined) {
        fishPoints[name] = new GeoPoint(f, {"name": name});
      }
    });

    parserResults.forEach(([letter, description]) => {
      let trackRoute = [];
      let trackIsComplete = true;
      const isMine = this.isMyTrack(letter);
      let labelDict = (isMine) ? {}: fishPoints;
      if (isMine) {
        this.route.points.forEach((g) => {
          if (g.name !== "") {
            labelDict[g.name] = g
          }
        })
      }
      description.split(" LVLS ", 1)[0].split(" ").forEach((p) => {
        const label = p.trim();
        if (label !== "") {
          if (pattern.exec(label) !== null) {
            trackRoute.push(new GeoPoint(label, {"name": label, "normalizer": arinc_normalizer}));
          } else {
            let geoPoint = labelDict[label];
            if (geoPoint !== undefined) {
              trackRoute.push(new GeoPoint(geoPoint, {"name": label}));
            } else {
              trackIsComplete = false;
            }
          }
        }
      });
      tracks.push(new Track(trackRoute,
        {
          "name": `NAT ${letter}`,
          "description": description,
          "isMine": isMine,
          "isComplete": trackIsComplete
        }));
    });
    return tracks;
  }

  /**
   * Returns FPL as an Array
   * @returns {string[]}
   */
  get fpl() {
    const infos = this.infos;
    let text = infos.rawFplText
      .extract(`-${infos.departure}`, `-${infos.destination}`, false);
    text = text.substring(text.indexOf(" ") + 1);
    let results = [infos.departure];
    text.split(" ").map((v) => v.trim())
      .forEach((v) => {
        if (v !== "" && !v.startsWith("-N")){
          results.push(v);
        }
      });
    results.push(infos.destination);
    return results;
  }

  /**
   * FPL route found in OFP (fpl without speed/FL annotations)
   * @returns {string[]}
   */
  get fplRoute() {
    // eslint-disable-next-line arrow-body-style
    return this.cache("fplRoute", () => {
      return this.fpl.map((p) => {
        if (p.includes("/")) {
          return p.split("/",1)[0];
        }
        return p;
      });
    });
  }

  get route() {
    return this.cache("route", () => new Route(this.wptCoordinates()));
  }
}
