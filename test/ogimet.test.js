/* eslint-disable sort-imports */
/* eslint-env jest */

import {GeoPoint} from "../src/modules/geopoint";
import {GeoGridIndex} from "../src/modules/geoindex";

test('getNearestPointsDirty', () => {
    const centerPoint = new GeoPoint([49, 2]);
    const wmoGrid = new GeoGridIndex();
    let nearest = wmoGrid.getNearestPointsDirty(centerPoint, 100);
    expect(() => {
        Array.from(nearest);
      }).toThrow();
});
