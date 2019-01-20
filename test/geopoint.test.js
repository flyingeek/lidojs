/* eslint-env jest */
import {
  GeoPoint,
  NM, R,
  arinc_normalizer, array_normalizer,
  dm2decimal,
  dm_normalizer,
  km_to_nm, km_to_rad, nm_to_rad, rad_to_km, rad_to_nm
} from "../src/modules/geopoint";
import {LatLng, LatPhi, latphi2latlng} from "../src/modules/geolite";


test("rad_to_nm", () => {
    expect(rad_to_nm(1)).toBe(R / NM);
    expect(rad_to_nm(1 / 3600)).toBeCloseTo(0.95557355);
});

test("nm_to_rad", () => {
    expect(nm_to_rad(0.95557355)).toBeCloseTo(1/3600);
    expect(nm_to_rad(R / NM)).toBeCloseTo(1);
});

test("rad_to_km", () => {
    expect(rad_to_km(1)).toBeCloseTo(6371);
});

test("km_to_rad", () => {
    expect(km_to_rad(6371)).toBeCloseTo(1);
});

test('km to nm conversion', () => {
    expect(km_to_nm( 1.852 )).toBeCloseTo(1);
});

test("dm2decimal", () => {
    expect(dm2decimal('N5530.3')).toBeCloseTo(55.505 ,3);
    expect(dm2decimal('E05530.3')).toBeCloseTo(55.505 ,3);
    expect(dm2decimal('S5530.3')).toBeCloseTo(-55.505 ,3);
    expect(dm2decimal('W05530.3')).toBeCloseTo(-55.505 ,3);
    expect(() => {
        dm2decimal('U05530.3');
    }).toThrow();
});

test("latlng_normaliser", () => {
  const latlng = array_normalizer([1, 2])
  expect(latlng.latitude).toBe(1);
  expect(latlng.longitude).toBe(2);
});

test("dm_normalizer", () => {
  expect(dm_normalizer('N5530.3E01030.3')).toEqual(new LatLng(55.505, 10.505));
  expect(dm_normalizer(['N5530.3', 'E01030.3'])).toEqual(new LatLng(55.505, 10.505));
});

test("arinc_normalizer", () => {
  expect(arinc_normalizer("55N020W")).toBeInstanceOf(LatLng);
  expect(arinc_normalizer('55N020W')).toEqual(new LatLng(55, -20));
  expect(arinc_normalizer('55S020W')).toEqual(new LatLng(-55, -20));
  expect(arinc_normalizer('55S020E')).toEqual(new LatLng(-55, 20));
  expect(arinc_normalizer('55N020E')).toEqual(new LatLng(55, 20));
  expect(arinc_normalizer('N5520')).toEqual(new LatLng(55.5, -20));
  expect(arinc_normalizer('E5520')).toEqual(new LatLng(55.5, 20));
  expect(arinc_normalizer('S5520')).toEqual(new LatLng(-55.5, 20));
  expect(arinc_normalizer('5N520')).toEqual(new LatLng(55.5, -120));
  expect(arinc_normalizer('5E520')).toEqual(new LatLng(55.5, 120));
  expect(arinc_normalizer('5S520')).toEqual(new LatLng(-55.5, 120));
  expect(arinc_normalizer('5W520')).toEqual(new LatLng(-55.5, -120));
  expect(arinc_normalizer('5530N020W')).toEqual(new LatLng(55.5, -20));
  expect(arinc_normalizer('5530N02000W')).toEqual(new LatLng(55.5, -20));
  expect(() => {
    arinc_normalizer('5U520');
  }).toThrow();
  expect(() => {
    arinc_normalizer('U55520');
  }).toThrow();
});


test('latphi property', () => {
  expect(new GeoPoint(new LatLng(45, -100)).latphi)
      .toEqual(new LatPhi(0.7853981633974483, -1.7453292519943295));
});

test("distance", () => {
  const geopoint1 = new GeoPoint([30, 13]);
  const geopoint2 = new GeoPoint([50, -77]);
  expect(GeoPoint.distance(geopoint1, geopoint2)).toBeCloseTo(geopoint1.distanceTo(geopoint2));
  expect(GeoPoint.distance(geopoint1, geopoint2, rad_to_nm)).toBeCloseTo(geopoint1.distanceTo(geopoint2, rad_to_nm));
});

test("distance_to", () => {
  let geopoint1 = new GeoPoint([0, 90]);
  let geopoint2 = new GeoPoint([0, -90]);
  //distance to self
  expect(geopoint1.distanceTo(geopoint1)).toBe(0);
  //both points on equator
  expect(geopoint1.distanceTo(geopoint2)).toBeCloseTo(Math.PI);
  //equator to pole
  geopoint2 = new GeoPoint([90, -90]);
  expect(geopoint1.distanceTo(geopoint2)).toBeCloseTo(Math.PI / 2);
  //date line boundary
  geopoint1 = new GeoPoint([0, 179]);
  geopoint2 = new GeoPoint([0, -179]);
  expect(geopoint1.distanceTo(geopoint2)).toBeCloseTo(2 * Math.PI / 180);
  //equator boundary
  geopoint1 = new GeoPoint([1, 0]);
  geopoint2 = new GeoPoint([-1, 0]);
  expect(geopoint1.distanceTo(geopoint2)).toBeCloseTo(2 * Math.PI / 180);
  //greenwhich boundary
  geopoint1 = new GeoPoint([0, 1]);
  geopoint2 = new GeoPoint([0, -1]);
  expect(geopoint1.distanceTo(geopoint2)).toBeCloseTo(2 * Math.PI / 180);
  geopoint1 = new GeoPoint([30, 13]);
  geopoint2 = new GeoPoint([50, -77]);
  expect(geopoint1.distanceTo(geopoint2, rad_to_nm)).toBeCloseTo(4051, 0);
  expect(geopoint1.distanceTo(geopoint2, rad_to_km)).toBeCloseTo(7503, 0);
});

test("equals", () => {
  let geopoint1 = new GeoPoint([30, 13]);
  let geopoint2 = new GeoPoint([50, -77]);
  expect(geopoint1.equals(geopoint1)).toBeTruthy();
  expect(geopoint1.equals(geopoint2)).toBeFalsy();
  geopoint1 = new GeoPoint([0, 46.6822]);
  geopoint2 = new GeoPoint([0, 46.6822001]);
  expect(geopoint1.equals(geopoint1)).toBeTruthy();
});

test("atFraction", () => {
  let geopoint1 = new GeoPoint([30, 13]);
  let geopoint2 = new GeoPoint([50, -77]);
  let middle = new GeoPoint([49.5732910, -23.5838094]);
  expect(geopoint1.atFraction(geopoint2, 0.5).equals(middle)).toBeTruthy();
});

test("creation using a GeoPoint", () => {
  let geopoint1 = new GeoPoint([30, 13], {"name": 'P1', "description": 'D1'});
  let geopoint2 = new GeoPoint(geopoint1, {"name": 'P2', "description": 'D2'});
  expect(geopoint1.equals(geopoint2)).toBeTruthy();
  expect(geopoint2.name).toBe("P2");
  expect(geopoint2.description).toBe("D2");
});

test.skip("creation from LatPhi Array", () => {
  //TODO this is used in editolido library but here ?
  let geopoint = new GeoPoint([0.7853981633974483, -1.7453292519943295], {"normalizer": latphi2latlng});
  expect(geopoint.latitude).toBeCloseTo(45);
  expect(geopoint.longitude).toBeCloseTo(-100);
});

test("creation from LatPhi", () => {
  let geopoint = new GeoPoint(
      new LatPhi(0.7853981633974483, -1.7453292519943295), {"normalizer": latphi2latlng});
  expect(geopoint.latitude).toBeCloseTo(45);
  expect(geopoint.longitude).toBeCloseTo(-100);
});

test("GeoPoint object StringTag", () => {
  expect(new GeoPoint().toString()).toBe('[object GeoPoint]');
});

test("getCenter", () => {
  let g1 = new GeoPoint([1, 10]);
  let g2 = new GeoPoint([-1, 10]);
  let g3 = new GeoPoint([0, 9]);
  let center = GeoPoint.getCenter([g1, g2, g3]);
  expect(center.equals(new GeoPoint([0, 9.5])));
  g1 = new GeoPoint([45, 1]);
  g2 = new GeoPoint([45, -1]);
  g3 = new GeoPoint([46, 0]);
  center = GeoPoint.getCenter([g1, g2, g3]);
  expect(center.equals(new GeoPoint([45.5, 0])));
});
