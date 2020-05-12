/* eslint-disable sort-imports */
/* eslint-env jest */

import {GeoPoint, km_to_rad} from "../src/modules/geopoint";
import {GeoGridIndex} from "../src/modules/geoindex";
import {loadWmo} from "./utils";

test('getNearestPointsDirty', () => {
    const centerPoint = new GeoPoint([56.2, 0]);
    const wmoGrid = new GeoGridIndex();
    let nearest = wmoGrid.getNearestPointsDirty(centerPoint, 100);
    expect(() => {
        Array.from(nearest);
      }).toThrow();
    wmoGrid.data = loadWmo();
    nearest = Array.from(wmoGrid.getNearestPointsDirty(centerPoint, 75, km_to_rad));
    expect(nearest.length).toEqual(12);
});

test('getNearestPoints', () => {
    const centerPoint = new GeoPoint([55, 0]);
    const wmoGrid = new GeoGridIndex();
    wmoGrid.data = loadWmo();
    const nearest = Array.from(wmoGrid.getNearestPoints(centerPoint, 75, km_to_rad));
    expect(nearest.length).toEqual(2);
});
