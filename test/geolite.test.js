/* eslint-env jest */
import {LatLng, PhiLam, latlng2dm, philam2latlng} from '../src/modules/geolite';

test('philam2latlng', () => {
    const philam = new PhiLam(0.3, -1.0);
    const latlng = philam.asLatLng;
    expect(latlng).toBeInstanceOf(LatLng);
    expect(philam.phi).toBeCloseTo(latlng.latitude * Math.PI / 180);
    expect(philam.lam).toBeCloseTo(latlng.longitude * Math.PI / 180);
    const latlng2 = philam2latlng(philam);
    expect(latlng2).toBeInstanceOf(LatLng);
    expect(philam.phi).toBeCloseTo(latlng2.latitude * Math.PI / 180);
    expect(philam.lam).toBeCloseTo(latlng2.longitude * Math.PI / 180);
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

test("LatLng to PhiLam conversion", () => {
    const philam = new LatLng(45, 90).asPhiLam;
    expect(philam).toBeInstanceOf(PhiLam);
    expect(philam.phi).toBeCloseTo(Math.PI / 4);
    expect(philam.lam).toBeCloseTo(Math.PI / 2);
});

test("LatLng object StringTag", () => {
    expect(new LatLng().toString()).toBe('[object LatLng]');
});

test("PhiLam object StringTag", () => {
    expect(new PhiLam().toString()).toBe('[object PhiLam]');
});
