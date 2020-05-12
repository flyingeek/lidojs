import {GeoPoint, km_to_rad} from "./geopoint";
import geohash from "ngeohash";

// dependence between hashtag's precision and distance accurate calculating
// in fact it's sizes of grids in km
export const GEO_HASH_GRID_SIZE = {
    "1": 5000.0,
    "2": 1260.0,
    "3": 156.0,
    "4": 40.0,
    "5": 4.8,
    "6": 1.22,
    "7": 0.152,
    "8": 0.038
}

export class GeoGridIndex {
    constructor(precision=3) {
        this.precision = precision;
        this.gridSize = km_to_rad(GEO_HASH_GRID_SIZE[precision.toString()]);
        this.data = {};
    }

    /**
     * Get Nearest points based on the geohash of the point
     * It returns all wmo points in the 9 adjacents tiles
     * @param {GeoPoint} centerPoint
     * @param {number} radius the radius in radians (unless a converter is given)
     * @param {?function} converter
     * @generator {GeoPoint}
     */
    *getNearestPointsDirty(centerPoint, radius, converter=km_to_rad) {
        if (converter !== null) {
            radius = converter(radius);
        }
        if (radius > this.gridSize / 2.0) {
            // radius is too big for current grid, we cannot use 9 neighbors
            // to cover all possible points
            let suggestedPrecision = 0;
            for (const [precision, maxSize] of Object.entries(GEO_HASH_GRID_SIZE)) {
                if (radius > km_to_rad(maxSize) / 2.0) {
                    suggestedPrecision = parseInt(precision, 10) - 1;
                    break;
                }
            }
            throw new Error(`Too large radius, please rebuild GeoHashGrid with precision="${suggestedPrecision}"`);
        }
        const centerHash = geohash.encode(centerPoint.latitude, centerPoint.longitude, this.precision);
        let meAndNeighbors = geohash.neighbors(centerHash);
        meAndNeighbors.push(centerHash);
        for (const hash of meAndNeighbors) {
            if (hash in this.data) {
                for (const [name, latitude, longitude] of this.data[hash]) {
                    yield new GeoPoint([latitude, longitude], {"name": name});
                }
            }
        }
    }

    /**
     * find nearest wmo points. Returns an array of [[distance, GeoPoint]]
     * @param {GeoPoint} centerPoint
     * @param {number} radius the radius in radians unless a converter is set
     * @param {?function} converter fn return radians
     * @returns {{[number, GeoPoint]}} distance from centerPoint and a GeoPoint of the wmo
     */
    *getNearestPoints(centerPoint, radius, converter=km_to_rad) {
        if (converter !== null) {
            radius = converter(radius);
        }
        for (const geoPoint of this.getNearestPointsDirty(centerPoint, radius, null)) {
            let distance = geoPoint.distanceTo(centerPoint, null);
            if (distance <= radius) {
                if (converter !== null) {
                    distance /= converter(1.0);
                }
                yield [distance, geoPoint];
            }
        }
    }
}
