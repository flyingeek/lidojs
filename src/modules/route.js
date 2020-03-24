import {nm_to_rad, rad_to_nm} from "./geopoint";


/** Class representing a route. */
class Route {

    /**
     * Create a route.
     * @param {GeoPoint[]} points
     * @param {?Object} [options={}]
     * @param {string} [options.name=""]
     * @param {string} [options.description=""]
     */
    constructor(points, {name="", description=""} = {}) {
        this.points = points || [];
        this.name = name;
        this.description = description;
    }

    // eslint-disable-next-line class-methods-use-this
    get [Symbol.toStringTag]() {
        return 'Route';
    }

    /**
     * Route iterator - iterates over the route's points
     * @returns {GeoPoint|*}
     */
    get [Symbol.iterator] () {
        return this.points[Symbol.iterator];
    }
    // implementing like this causes a ReferenceError: regeneratorRuntime is not defined
    // *[Symbol.iterator]() {
    //     yield* this.points;
    // }

    /**
     * check if two routes contains the same points
     * @param route2
     * @returns {boolean}
     */
    equals(route2) {
        if (this.points.length !== route2.points.length) return false;
        const zip = (a, b) => a.map((e, i) => [e, b[i]]);
        for (let [p1, p2] of zip(this.points, route2.points)) {
            if (! p1.equals(p2)) return false;
        }
        return true;
    }

    /**
     * if route points are [a, b, c], this returns [[a, b], [b, c]]
     * @returns {GeoPoint[]}
     */
    get segments() {
        let segments = [];
        if (this.points.length > 0){
            this.points.reduce((prev, current) => {
                segments.push([prev, current]);
                return current;
            });
        }
        return segments;
    }

    /**
     * Returns the distance of the route, unit is set by the converter.
     * @param {?function} converter - if null returns the distance in radians
     * @returns {number}
     */
    distance(converter=rad_to_nm) {
        const distance = this.segments
            .map(([p1, p2]) => p1.distanceTo(p2))
            .reduce((accumulator, current) => accumulator + current, 0);
        if (converter === null) {
            return distance;
        }
        return converter(distance);
    }

    /**
     * Split a route in smaller segments.
     * The new Route might be different from the original one as original
     * start and end of inner segments are not preserved by default.
     *
     * @param {number} maxLength - length of the segment, by default in NM
     * @param {?Object} options - additional options are the Route options
     * @param {?function} [options.converter] - must transform maxLength in radians
     * @param {?boolean} [options.preserve] - if false, split at maxLength, do not keep intermediary points
     * @param {string} [options.name] - generated route name
     * @param {string} [options.description] - generated route description
     * @returns {Route}
     */
    split(maxLength, options = {}){
        let {converter=nm_to_rad, preserve=false} = options || {};
        let points = [];
        let remaining = 0;
        let first = true;
        let maxRadians = (converter) ? converter(maxLength) : maxLength;
        let geopoint1 = null,
            geopoint2 = null;
        for ([geopoint1, geopoint2] of this.segments) {
            if (first) {
                first = false;
                points.push(geopoint1); // first point
            }
            let segmentLength = geopoint1.distanceTo(geopoint2);
            let d = remaining
            while (d <= segmentLength - maxRadians) {
                d += maxRadians;
                points.push(geopoint1.atFraction(geopoint2, d / segmentLength, segmentLength));
            }
            remaining = parseFloat((d - segmentLength).toFixed(10)); // <=> python round(value, 10)
            if (preserve && remaining) {
                points.push(geopoint2);
                remaining = 0;
            }
        }
        if (remaining) {
            points.push(geopoint2); // last if not emitted
        }
        return new Route(points, options);
    }
}

/**
 * a Track is a Route with additional properties and methods
 */
class Track extends Route {

    /**
     * Track constructor
     * @param {GeoPoint[]} points
     * @param {?Object} [options={}]
     * @param {string} [options.name=""]
     * @param {string} [options.description=""]
     * @param {boolean} [options.isMine=false] - true when my route uses this track
     * @param {boolean} [options.isComplete=true] - true when there is no missing points in the track
     */
    constructor(points, options) {
        let {isMine=false, isComplete=true} = options || {};
        super(points, options);
        this.isMine = isMine;
        this.isComplete = isComplete;
    }

    // eslint-disable-next-line class-methods-use-this
    get [Symbol.toStringTag]() {
        return 'Track';
    }
}

export {Route, Track};
