import {GeoPoint} from './geopoint';
const AIRPORTS = require('./airports.json');
const IATADB = require('./iata2icao.json');
const TZDB = require('./timezones.json');

/** return icao code for a iata code or '????' */
export function iata2icao(iata) {
    const index = IATADB.indexOf(iata + ':');
    return (index >= 0) ? IATADB.substring(index + 4, index + 8) : '????';
}

/** return iata code for a icao code or '???' */
export function icao2iata(icao) {
    const index = IATADB.indexOf(':' + icao);
    return (index >= 0) ? IATADB.substring(index - 3, index) : '???';
}

/** return iata timezone "Europe/Paris" or undefined*/
export function iata2tz(iata) {
    const index = IATADB.indexOf(iata + ':');
    if (index >= 0) {
        const tz = IATADB.substring(index + 8, index + 10);
        return (tz === '00') ? undefined : TZDB[tz];
    }
    return undefined;
}

/** return timezone offset "-2" "+5.5" for iata at a date like "2021-08-12T14:25Z" or undefined */
export function tzOffset(iata, isoString) {
    const timeZone = iata2tz(iata);
    if (!timeZone) return undefined;
    let event = new Date(Date.parse(isoString));
    // British English uses day/month/year order and 24-hour time without AM/PM
    // eslint-disable-next-line init-declarations
    let loc;
    try {
        loc = event.toLocaleString("en-GB", {timeZone});
    } catch (e) {
        return undefined;
    }
    const re = /(\d\d)\/(\d\d)\/(\d\d\d\d), (\d\d):(\d\d):\d\d/u
    const match = re.exec(loc);
    if (match !== null) {
        const [, day, month, year, hour, minute] = match;
        const baseIsoString = `${year}-${month}-${day}T${hour}:${minute}`;
        const baseEvent = new Date(Date.parse(baseIsoString + "Z"));
        const offset = (baseEvent - event)/3600000;
        if (offset === 0) {
            return "+0";
        }
        let res = (offset >= 0) ? '+' : '-';
        res += offset.toFixed(1)
        return (res.endsWith('.0')) ? res.slice(0, -2) : res;
    }
    return undefined
}

/** return a LatLng from a iata code */
export function iata2GeoPoint(iata) {
    const name = iata2icao(iata);
    if (name) {
        const data = AIRPORTS[name];
        if (data) {
            return new GeoPoint(data, {name});
        }
    }
    return undefined
}
