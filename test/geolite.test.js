/* eslint-env jest */
import {LatLng, LatPhi, latlng2dm, latphi2latlng} from '../src/modules/geolite';

test('latphi2latlng', () => {
    const latphi = new LatPhi(0.3, -1.0);
    const latlng = latphi.asLatLng;
    expect(latlng).toBeInstanceOf(LatLng);
    expect(latphi.rlat).toBeCloseTo(latlng.latitude * Math.PI / 180);
    expect(latphi.phi).toBeCloseTo(latlng.longitude * Math.PI / 180);
    const latlng2 = latphi2latlng(latphi);
    expect(latlng2).toBeInstanceOf(LatLng);
    expect(latphi.rlat).toBeCloseTo(latlng2.latitude * Math.PI / 180);
    expect(latphi.phi).toBeCloseTo(latlng2.longitude * Math.PI / 180);
});

test('LatLng DM conversion test', () => {
    expect(new LatLng(0, 0).asDM).toBe('N0000.0W00000.0');
    expect(new LatLng(45, 0).asDM).toBe('N4500.0W00000.0');
    expect(new LatLng(-45, 0).asDM).toBe('S4500.0W00000.0');
    expect(new LatLng(-45, 1).asDM).toBe('S4500.0E00100.0');
    expect(new LatLng(-45.508333, 1.3).asDM).toBe('S4530.5E00118.0');
    expect(new LatLng(45.55, 1.55).asDM).toBe('N4533.0E00133.0');

    const latlng = new LatLng(9.5, 10.6);
    expect(latlng.asDM).toBe(latlng2dm(latlng));
});

test("LatLng to LatPhi conversion", () => {
    const latphi = new LatLng(45, 90).asLatPhi;
    expect(latphi).toBeInstanceOf(LatPhi);
    expect(latphi.rlat).toBeCloseTo(Math.PI / 4);
    expect(latphi.phi).toBeCloseTo(Math.PI / 2);
});

test("LatLng object StringTag", () => {
    expect(new LatLng().toString()).toBe('[object LatLng]');
});

test("LatPhi object StringTag", () => {
    expect(new LatPhi().toString()).toBe('[object LatPhi]');
});
