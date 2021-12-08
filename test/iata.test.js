/* eslint-env jest */
import {iata2GeoPoint, iata2icao, iata2tz, icao2iata, tzOffset} from '../src/modules/iata2icao.js';
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
test('iata2tz', () => {
    expect(iata2tz('???')).toBe(undefined);
    expect(iata2tz('CDG')).toBe('Europe/Paris');
});
test('tzOffset', () => {
    expect(tzOffset('???', '2021-08-01T14:00Z')).toBe(undefined);
    expect(tzOffset('CDG', '2021-08-01T14:00Z')).toBe('+2');
    expect(tzOffset('CDG', '2021-12-01T14:00Z')).toBe('+1');
    expect(tzOffset('DEL', '2021-12-01T14:00Z')).toBe('+5.5');
});
