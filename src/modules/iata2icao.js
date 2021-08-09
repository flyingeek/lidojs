import {GeoPoint} from './geopoint';
const AIRPORTS = require('./airports.json');
const IATADB = require('./iata2icao.json');

/** return icao code for a iata code or empty */
export function iata2icao(iata) {
    const index = IATADB.indexOf(iata + ':');
    return (index >= 0) ? IATADB.substring(index + 4, index + 8) : undefined;
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
