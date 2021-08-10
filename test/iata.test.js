/* eslint-env jest */
import {iata2GeoPoint, iata2icao, icao2iata} from '../src/modules/iata2icao.js';
import {GeoPoint} from '../src/modules/geopoint';

test('iata2icao', () => {
    expect(iata2icao('???')).toBe('????');
    expect(iata2icao('CDG')).toBe('LFPG');
});
test('icao2iata', () => {
    expect(icao2iata('????')).toBe('???');
    expect(icao2iata('LFPO')).toBe('ORY');
});
test('iata2LatLng', () => {
    expect(iata2GeoPoint('???')).toBe(undefined);
    const g = iata2GeoPoint('CDG');
    expect(g).toBeInstanceOf(GeoPoint);
    expect(g.latlng.asDM).toBe('N4900.6E00232.9');
    expect(g.name).toBe('LFPG');
});
