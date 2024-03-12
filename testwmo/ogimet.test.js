/* eslint-disable sort-imports */
/* eslint-env jest */

import {GeoPoint, km_to_rad} from "../src/modules/geopoint";
import {GeoGridIndex} from "../src/modules/geoindex";
import {loadWmo} from "../test/utils";

test('getNearestPointsDirty', () => {
    const centerPoint = new GeoPoint([49, 2]);
    const wmoGrid = new GeoGridIndex();
    let nearest = wmoGrid.getNearestPointsDirty(centerPoint, 100);
    expect(() => {
        Array.from(nearest);
      }).toThrow();
    wmoGrid.data = loadWmo();
    nearest = Array.from(wmoGrid.getNearestPointsDirty(centerPoint, 75, km_to_rad));
    expect(nearest.length).toEqual(40);
});

test('getNearestPoints', () => {
   const centerPoint = new GeoPoint([49,2]);
   const wmoGrid = new GeoGridIndex();
   wmoGrid.data = loadWmo();
   const nearest = Array.from(wmoGrid.getNearestPoints(centerPoint, 27, km_to_rad));
   expect(nearest.length).toEqual(2);
   expect(nearest[0][0].name).toEqual("07145");
});
