/* eslint-env jest */
import {GeoPoint} from "../src/modules/geopoint";
import {Route} from "../src/modules/route";

test("route segments", () => {
    const a = new GeoPoint([0, 0]);
    const b = new GeoPoint([0, 90]);
    const c = new GeoPoint([0, 180]);
    let route = new Route([a, b, c]);
    expect(route.segments).toEqual([[a, b], [b, c]]);
    route = new Route([a, b]);
    expect(route.segments).toEqual([[a, b]]);
    // noinspection JSCheckFunctionSignatures
  route = new Route();
    expect(route.segments).toEqual([]);
    route = new Route([a, c]); //TODO seems a duplicate of [a, b] no ?
    expect(route.segments).toEqual([[a, c]]);
});

test("route equals", () => {
    expect(
        new Route([new GeoPoint([0, 0]), new GeoPoint([0, 90])])
            .equals(
                new Route([new GeoPoint([0.0000001, 0.0000001]), new GeoPoint([0, 90])])
            )
        ).toBeTruthy();
    expect(
        new Route([new GeoPoint([0, 0]), new GeoPoint([0, 90])])
            .equals(
                new Route([new GeoPoint([0.1, 0]), new GeoPoint([0, 90])])
            )
        ).toBeFalsy();
    expect(
        new Route([new GeoPoint([0, 0]), new GeoPoint([0, 90])])
            .equals(
                new Route([new GeoPoint([0, 0.1]), new GeoPoint([0, 90])])
            )
        ).toBeFalsy();
    expect(
        new Route([
            new GeoPoint([0, 0]),
            new GeoPoint([0, 90])])
            .equals(
                new Route([
                    new GeoPoint([0, 0]),
                    new GeoPoint([0, 90]),
                    new GeoPoint([0, 179])])
            )
        ).toBeFalsy();
    expect(
        new Route([
            new GeoPoint([0, 0]),
            new GeoPoint([0, 90]),
            new GeoPoint([0, 180])])
            .equals(
                new Route([
                    new GeoPoint([0, 0]),
                    new GeoPoint([0, 90])])
            )
        ).toBeFalsy();
});

test("distance", () => {
  // noinspection JSCheckFunctionSignatures
  expect(new Route().distance(null)).toBeCloseTo(0);
    let a = new GeoPoint([0, 0]);
    let b = new GeoPoint([0, 90]);
    let c = new GeoPoint([0, 180]);
    expect(new Route([a, b, c]).distance(null)).toBeCloseTo(Math.PI);
    expect(new Route([c, b, a]).distance(null)).toBeCloseTo(Math.PI);
    expect(new Route([a, c]).distance(null)).toBeCloseTo(Math.PI);
    let d = new GeoPoint([-90, 0]);
    expect(new Route([a, d, c]).distance(null)).toBeCloseTo(Math.PI);
});

test("Route object StringTag", () => {
  // noinspection JSCheckFunctionSignatures
  expect(new Route().toString()).toBe('[object Route]');
});

test("route iterator", () => {
  // noinspection JSCheckFunctionSignatures
  const route = new Route(['a', 'b', 'c']);
    let i = 0;
    for (let p of route){
        expect(p).toBe(route.points[i]);
        i += 1;
    }
});

test("route split", () => {
    // noinspection JSCheckFunctionSignatures
    let route = new Route();
    expect(route.split(60).points).toEqual([]);
    let start = new GeoPoint([0, 0]);
    let end = new GeoPoint([0, 90]);
    route = new Route([start, end]);
    let size = route.distance() / 2;
    let middle = new GeoPoint([0, 45]);
    // we split at a distance representing the middle point
    expect(route.split(size).equals(new Route([start, middle, end]))).toBeTruthy();
    let a = new GeoPoint([0, 10]);
    let b = new GeoPoint([0, 55]);
    // our route follow the equator so it passes by a and b
    route = new Route([start, a, end]);
    // with preseve false, a and b are ignored
    expect(route.split(size).equals(new Route([start, middle, end]))).toBeTruthy();
    // with preserve true, a and b are presents, thus middle is not present as all distance are <= middle distance
    expect(route.split(size,{"preserve": true}).equals(new Route([start, a, b, end]))).toBeTruthy();
    route = new Route([start, a, middle, end]);
    // with preserve false, a is not in the output
    expect(route.split(size).equals(new Route([start, middle, end]))).toBeTruthy();
    // with preserve true, a is present, as a<->end > middle distance, middle is also present
    expect(route.split(size,{"preserve": true}).equals(new Route([start, a, middle, end]))).toBeTruthy();
});

