/* eslint-disable no-underscore-dangle,max-lines-per-function, max-lines */

import {GeoPoint, arinc_normalizer} from "./geopoint";
import {Route, Track} from "./route";
import {wptRegExp} from "./ofp_extensions";
// eslint-disable-next-line sort-imports
import {ofpInfos} from "./ofp_infos";


const pdfParsers = Object.freeze({
  "pypdf2": 3,
  "pdfjs": 4
});

const ofpTypes = Object.freeze({
  "S4": 1,
  "NVP": 2
});

const FISHPOINTS = require('./fishpoints');

export class Ofp {
  constructor(text="") {
    console.assert(text.startsWith("_PDFJS_"), "invalid text file");
    this.pdfParser = pdfParsers.pdfjs;
    this.ofpType = ofpTypes.S4;
    if (text.includes("--FLIGHT SUMMARY--")) {
      this.ofpType = ofpTypes.NVP;
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
    this.removePageFooterRegex = new RegExp(String.raw`([\s-]\d{1,2})?Page\s[0-9]+\s.+?Page\s[0-9]+.+?\/${this.infos['depICAO']}-${this.infos['destICAO']}`, 'gsu');
    this.text = text.replace(this.removePageFooterRegex,'');
    this.cache = function (name, fn) {
      if (this.cacheStore === undefined) {
        this.cacheStore = {}; /* on first run create cache storage */
      }
      if (this.cacheStore[name] === undefined) {
        this.cacheStore[name] = fn();
      }
      return this.cacheStore[name];
    };
  }

  get description() {
    const infos = this.infos;
    return `${infos.flightNo} ${infos.depICAO}-${infos.destICAO} ${infos.ofpTextDate} ${infos.ofpOUT.toISOString().substring(11,16)}z OFP ${infos.ofp}`;
  }

  /**
   * Array of WPT COORDINATES found in OFP
   * @param start the text marker for start (useful for tests)
   * @param end the end marker for end (useful for tests)
   * @returns {GeoPoint[]}
   */
  wptCoordinates(start="WPT COORDINATES") {
    const infos = this.infos;
    const end = (this.ofpType === ofpTypes.NVP) ? '----' + infos['destICAO']: '----';
    const extract = this.text.extract(start, end);
    const geoPoints = extract.matchAll(wptRegExp);
    if (geoPoints.length > 0) {
      if (!infos.inFlightReleased) {
        geoPoints[0].name = this.infos['depICAO']; // avoid name problems
      } else if (infos.inFlightStart) {
        geoPoints[0].name = infos.inFlightStart;
      }
    }
    return geoPoints;
  }

  /**
   * Array of WPT COORDINATES for alternate found in OFP
   * @param start the text marker for start (useful for tests)
   * @param end the end marker for end (useful for tests)
   * @returns {GeoPoint[]}
   */
  wptCoordinatesAlternate(start='WPT COORDINATES', end_is_optional=false) {

    const end = (this.ofpType === ofpTypes.NVP) ? '--WIND INFORMATION--': 'ATC FLIGHT PLAN';
    // take only what is after the last '----' (python rsplit)
    // eslint-disable-next-line require-jsdoc
    function reverse(str) {
      return [...str].reverse().join('');
    }
    const t = this.text.extract(start, end, end_is_optional)
    const extract = reverse(t).split('----', 1)[0];
    return reverse(extract).matchAll(wptRegExp);
  }

  wptNamesEET(geoPoints) {
    const start = 'ATC DEPARTURE';
    const pattern = /[\s-]([A-Z0-9/]+)\s+[0-9]{3}\s+(?:[0-9.\s]{4})\s+\.\.\.\.\/\.\.\.\.\s(.{3})\s[A-Z0-9/.+\s-]+?[0-9]{4}\/([0-9]{4})\s+[0-9]{3}\/[0-9]{3}/gu;
    const extract = this.text.extract(start, 'DESTINATION ALTERNATE', true);
    const matches = extract.matchAll(pattern);

    const eet = {};
    let previousEET = 0;
    // eslint-disable-next-line init-declarations
    let previousFL = this.infos.levels[0];
    for (let [,name, level, t,] of matches) {
      //console.log(name)
      if (name.startsWith('/')) name = name.slice(1); // ofp AF082
      const fl = parseInt(level, 10);
      if (!isNaN(fl)) previousFL = fl;
      eet[name.split('/')[0]] = [previousEET, previousFL];
      previousEET = (parseFloat(t.slice(0,2)) * 60) + parseFloat(t.slice(2))
    }
    eet[this.infos['destICAO']] = [previousEET, previousFL];
    //console.log(eet);
    const results = [];
    let error = false;
    const tryAlts = (altnames) => {
      for (const altFn of altnames) {
        const altname = altFn();
        if (altname !== null && eet[altname] !== undefined) {
          return eet[altname];
        }
      }
      return undefined;
    }
    for (const p of geoPoints) {
      if (eet[p.name] === undefined) {
        const alternative = tryAlts([
          () => p.name.replace(/00\.0/gu,''),
          () => p.name.replace(/\.0/gu,''),
          () => ((p.name === 'N5928.0W10155.4') ? 'N5928W10155' : null),
        ]);
        if (alternative) {
          results.push([p, ...alternative]);
        } else {
          console.log('missing point', p.name);
          error = true;
          break;
        }
      } else {
          results.push([p, ...eet[p.name]]);
      }
    }
    return (error) ? [] : results;
  }

  /**
   * check if the designated track is in the FPL
   * @param letter
   * @returns {boolean}
   */
  isMyTrack(letter) {
    return this.fplRoute.indexOf(Track.label(letter)) !== -1;
  }

  /**
   * Parse the OFP and return tracks as an array of [trackLetter, trackDescription]
   * @returns {[]}
   */
  trackParser() {
    let extract = "";
    const infos = {};
    try {
      extract = this.text
        .extract("ATC FLIGHT PLAN").extract(')');
    } catch (e) {
      return [];
    }
    let results = [];
    if (extract.includes("REMARKS:")) {
      extract = extract.split("REMARKS:", 1)[0];
      extract = extract.split("Generated at", 1)[0];
    }
    if (extract.includes(" NOTES:")) {
      extract = extract.split(" NOTES:", 1)[0];
    }
    if (extract.includes(" LVLS ")) {
      // split at track letter, discard first part
      const a = extract.split(/(?:\s|[^A-Z\d])([A-Z])\s{3}/gu).slice(1);
      // results are [trackLetter, trackDescription]
      for (let i = 0, max = a.length; i < max; i += 2) {
        let trackDescription = a[i + 1];
        results.push([a[i], trackDescription]);
      }
    } else if (extract.includes('TRACKS')) {
      console.error("Unknown TRACKSNAT message format");
      console.log(extract);
    }
    return {results, infos};
  }

  /**
   * Tracks found in the OFP as an array of Track
   * @returns {Track[]}
   */
  get tracks() {
    return this.cache("tracks", () => {
      const {results, infos} = this.trackParser();
      const pattern = /(\d{2,4}[NS]\d{3,5}[EW]|[NESW]\d{4}|\d[NESW]\d{3}[^EW])/u;
      let fishPoints = {};
      let tracks = [];

      //find unknows named waypoints in tracks
      let unknowns = [];
      // eslint-disable-next-line array-callback-return
      results.map(([, description]) => {
        description.split(" LVLS ", 1)[0].split(" ")
          .forEach((p) => {
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

      results.forEach(([letter, description]) => {
        let trackRoute = [];
        let trackIsComplete = true;
        const isMine = this.isMyTrack(letter);
        let labelDict = (isMine) ? {} : fishPoints;
        if (isMine) {
          this.route.points.forEach((g) => {
            if (g.name !== "") {
              labelDict[g.name] = g
            }
          })
        }
        description.split(" LVLS ", 1)[0].split(" ")
          .forEach((p) => {
            const label = p.trim();
            if (label !== "") {
              if (pattern.exec(label) !== null) {
                trackRoute.push(new GeoPoint(label, {
                  "name": label,
                  "normalizer": arinc_normalizer
                }));
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
        let direction = "";
        if (description.match(/RTS WEST/u)) direction = "WEST";
        if (description.match(/RTS EAST/u)) direction = "EAST";
        tracks.push(new Track(trackRoute,
          {
            "name": `NAT ${letter}`,
            "description": description,
            "isMine": isMine,
            "isComplete": trackIsComplete,
            "infos": {...infos, direction}
          }));
      });
      return tracks;
    });
  }

  /**
   * Returns FPL as an Array
   * @returns {string[]}
   */
  fpl() {
    const infos = this.infos;
    let text = infos.rawFPL.extract(`-${infos.depICAO}`, `-${infos.destICAO}`, false);
    text = text.substring(text.indexOf(" ") + 1);
    let results = [infos.depICAO];
    text.split(" ").map((v) => v.trim())
      .forEach((v) => {
        if (v !== "" && !v.startsWith("-N")){
          results.push(v);
        }
      });
    results.push(infos.destICAO);
    return results;
  }

  /**
   * FPL route found in OFP (fpl without speed/FL annotations)
   * @returns {string[]}
   */
  get fplRoute() {
    return this.cache("fplRoute",
      () => this.fpl().map((p) => {
        if (p.includes("/")) {
          return p.split("/", 1)[0];
        }
        return p;
      })
    );
  }

  get route() {
    return this.cache("route", () => new Route(this.wptCoordinates()));
  }

  lidoRoute(replaceSID=true) {
    return this.cache("lidoRoute" + ((replaceSID) ? "_r" : ""), () => {
      const points = [];
      const pointsName = []; // used if replaceSID === false
      const rawPoints = []; // used if replaceSID === true
      this.route.points.forEach((p) => {
        rawPoints.push(p.dm);
        pointsName.push(p.name || p.dm);
        if (p.name === "" || (/\d+/u).exec(p.name) !== null) {
          points.push(p.dm);
        } else {
          points.push(p.name);
        }
      });
      let lidoPoints = [];

      let fplRoute = this.fplRoute;
      let fplRouteLenght = fplRoute.length;
      if (fplRouteLenght < 2) {
        return points;
      }
      let departure = fplRoute[0];
      let destination = fplRoute[fplRouteLenght - 1];
      let innerFplRoute = fplRoute.slice(1, -1);
      let innerFplRouteLength = innerFplRoute.length;


      // replace points by rawPoint before first common waypoint
      for (let i = 0; i < innerFplRouteLength; i += 1 ) {
        let p = innerFplRoute[i];
        let offset = points.indexOf(p);
        if (offset !== -1) {
          if (replaceSID) {
            lidoPoints = rawPoints.slice(1, offset).concat(innerFplRoute.slice(i));
          } else {
            lidoPoints = pointsName.slice(1, offset).concat(innerFplRoute.slice(i));
          }
          break;
        }
      }
      // replace points after last common waypoint by rawPoints
      let reversedPoints = points.slice().reverse(); // copy before reverse
      let reversedLidoRoute = lidoPoints.slice().reverse();
      let lidoRouteLength = lidoPoints.length;
      for (let i = 0; i < lidoRouteLength; i += 1 ) {
        let p = reversedLidoRoute[i];
        let offset = reversedPoints.indexOf(p);
        if (offset !== -1) {
          if (i > 0) {
            lidoPoints = lidoPoints.slice(0, -i);
          }
          if (replaceSID) {
            lidoPoints = lidoPoints.concat(rawPoints.slice(-offset, -1));
          } else {
            lidoPoints = lidoPoints.concat(pointsName.slice(-offset, -1));
          }
          break;
        }
      }
      // replace known tracks (NATA, NATB...) by track_points
      /**
       * When there is a FL or Speed change, we may have multiple
       * "NATW" in the FPL, so change them all.
       * @param fplPoints: [] - an array of fplPoints
       * @param needle: string
       * @param trackPoints
       * @returns {[]}
       */
      const recursiveNatReplace = function (fplPoints, needle, trackPoints) {
        let match = [];
        // infinite loop (while(true) breaks in browser)
        // https://stackoverflow.com/questions/24977456/how-do-i-create-an-infinite-loop-in-javascript
        for (;;) {
          let offset = fplPoints.indexOf(needle);
          if (offset === -1) {
            return match;
          }
          fplPoints.splice(offset, 1, ...trackPoints.slice(
            trackPoints.indexOf(fplPoints[offset - 1]) +1,
            trackPoints.indexOf(fplPoints[offset + 1])));
          match = fplPoints;
        }
      };

      this.tracks.forEach( (track) => {
        if (track.isMine) {
          let letter = track.name.slice(-1);
          let results = recursiveNatReplace(
            lidoPoints,
            Track.label(letter),
            track.points.map((p) => p.name)
          );
          if (results.length > 0) {
            lidoPoints = results;
          }
        }
      });
      lidoPoints.push(destination);
      lidoPoints.unshift((!this.infos.inFlightStart) ? departure : this.infos.inFlightStart);
      // adds alternates and ralts
      lidoPoints = lidoPoints.concat(...this.infos.alternates);
      lidoPoints= lidoPoints.concat(...this.infos.ralts);
      return lidoPoints;
    });
  }
}
