/* eslint-disable max-lines */
import {LatLng, PhiLam} from "./geolite";


// earth mean radius in meters
// nm in meters
const R = 6371000.0;
const NM = 1852.0;
const deg = 180 / Math.PI;
// Converters
const rad_to_nm = (radians) => radians * R / NM;
const rad_to_km = (radians) => radians * R / 1000.0;
const rad_to_deg = (radians) => radians * deg;
const nm_to_rad = (nm) => nm * NM / R;
const km_to_rad = (km) => km * 1000.0 / R;
const km_to_nm = (km) => km * 1000.0 / NM;

const fmod = (a, b) => Number((a - (Math.floor(a / b) * b)).toPrecision(8));

/**
 * convert geo coordinates in degrees, minutes in signed fixed value
 *  N5500.0 => 55.00000000
 *  W02000.0 => -20.00000000
 * @param s String
 * @returns {number}
 */
function dm2decimal(s) {
    // convert geo coordinates in degrees, minutes in signed decimal value
    // N5500.0 => Decimal('55.0')
    // W02000.0 => Decimal('-20.0')
    // :param s: str
    const letter = s[0];
    if ('NSEW'.indexOf(letter) < 0) throw new Error("invalid letter coordinates: " + s);
    const sign = (letter === 'N' || letter === 'E') ? 1 : -1;
    const offset = (letter === 'N' || letter === 'S') ? 3 : 4;
    const degrees = parseInt(s.slice(1, offset), 10);
    const minutes = parseFloat(s.slice(offset));
    return (sign * (degrees + minutes / 60))
}

// Normalizers
/**
 *  Useful for testing (it is the default normalizer).
 *  It transforms an array into a LatLng
 * @param {number[]} array - [latitude, longitude]
 * @returns {LatLng}
 */
function array_normalizer(array) {
    if (array && array.length) {
        return new LatLng(...array);
    }
    return new LatLng([0, 0])
}

/**
 * Normalize degrees minute value into LatLng
 * @param {string|string[]} mixedValue - 'N4038.4W07346.7' or ['N4038.4', 'W07346.7']
 * @returns {LatLng}
 */
function dm_normalizer(mixedValue) {
    let lat = 0,
        lng = 0;
    if (Array.isArray(mixedValue)) {
        [lat, lng] = mixedValue;
    } else {
        lat = mixedValue.slice(0, 7);
        lng = mixedValue.slice(7);
    }
    return new LatLng(dm2decimal(lat), dm2decimal(lng))
}

/**
 * Normalize ARINC point into LatLng
 * @param {string} label the arinc label
 * @returns {LatLng}
 */
function arinc_normalizer(label) {
    const signed = function (letter, lat, lng) {
        switch (letter) {
            case 'N': // NW + -
                return new LatLng(lat, -lng);
            case 'E': // NE + +
                return new LatLng(lat, lng);
            case 'S': // SE - +
                return new LatLng(-lat, lng);
            case 'W': // SW - -
                return new LatLng(-lat, -lng);
            default:
                throw new Error('invalid letter');
        }
    };
    let lat = 0,
        lng = 0;
    if ('NESW'.indexOf(label[0]) >= 0) {
        // N5520  lon<100
        lat = parseInt(label.slice(1,3), 10) + 0.5;
        lng = parseInt(label.slice(3, 5), 10);
        return signed(label[0], lat, lng);
    } else if ('NESW'.indexOf(label[1]) >=0) {
        // 5N520  lon>=100
        lat = parseInt(label[0] + label[2], 10) + 0.5;
        lng = parseInt("1" + label.slice(3,5), 10);
        return signed(label[1], lat, lng);
    } else if ('NS'.indexOf(label[4]) >= 0) {
        // 5530N020W => N5530.0W02000.0 => (55.5, -20)
        // 5530N02000W => N5530.0W02000.0 => (55.5, -20)
        lat = dm2decimal(label[4] + label.slice(0, 4) + ".0");
        lng = dm2decimal((label.slice(-1) + label.slice(5, -1) + "00").slice(0, 5) + ".0");
    } else {
        // 55N020W => N5500.0W02000.0 => (55.0, -20)
        lat = dm2decimal(label[2] + label.slice(0, 2) + "00.0");
        lng = dm2decimal(label.slice(-1) + label.slice(3, -1) + "00.0");
    }
    return new LatLng(lat, lng);
}


/** GeoPoint class is the base element to construct a Route */
class GeoPoint {

    /**
     * Create a GeoPoint.
     * @param {GeoPoint|LatLng|*} mixedValue - any value type supported by the normalizer
     * @param {string} [name=""]
     * @param {string} [description=""]
     * @param {?function} [normalizer=array_normalizer]
     */
    constructor(mixedValue, {name="", description="", normalizer=array_normalizer} = {}){
        if (mixedValue instanceof GeoPoint) {
            this.latlng = mixedValue.latlng;
            name = name || mixedValue.name || "";
            description = description || mixedValue.description || "";
        } else if (mixedValue instanceof LatLng) {
            this.latlng = mixedValue;
        } else if (mixedValue && typeof mixedValue === 'object'
            && Reflect.has(mixedValue, "longitude")
            && Reflect.has(mixedValue, "latitude")) {
            this.latlng = new LatLng(parseFloat(mixedValue.latitude), parseFloat(mixedValue.longitude));
            name = name || mixedValue.name || "";
            description = description || mixedValue.description || "";
        } else {
            this.latlng = normalizer ? normalizer(mixedValue) : mixedValue;
        }
        this.name = name.trim();
        this.description = description;
        this.philam_cache = null;
        this.dm_cache = null;
    }

    // eslint-disable-next-line class-methods-use-this
    get [Symbol.toStringTag]() {
        return 'GeoPoint';
    }

    get latitude() {
        return this.latlng.latitude;
    }
    get longitude() {
        return this.latlng.longitude;
    }

    /**
     * Lazy conversion PhiLam
     * @returns {PhiLam}
     */
    get philam() {
        if (this.philam_cache === null) {
            this.philam_cache = this.latlng.asPhiLam;
        }
        return this.philam_cache;
    }

    /**
     * Lazy Degrees Minutes String representation
     * @returns {null}
     */
    get dm() {
        if (this.dm_cache === null) {
            this.dm_cache = this.latlng.asDM;
        }
        return this.dm_cache;
    }

    /**
     * Get the spherical distance beetween two GeoPoints
     * @param {GeoPoint} geopoint1
     * @param {GeoPoint} geopoint2
     * @param {?function} converter - by default results in radians
     * @returns {*}
     */
    static distance(geopoint1, geopoint2, converter=null) {
        return geopoint1.distanceTo(geopoint2, converter)
    }

    /**
     * Get the course in radians between to GeoPoints
     * @param {GeoPoint} geopoint1 start GeoPoint
     * @param {GeoPoint} geopoint2 end GeoPoint
     * @returns {number} the course in radians
     */
    static course(geopoint1, geopoint2) {
        return geopoint1.course_to(geopoint2);
    }

    /**
     * Given the segment AB, computes cross track error at point D
     * @param {GeoPoint} point GeoPoint D
     * @param {[GeoPoint, GeoPoint]} segment segment AB
     * @param {?function} converter the converter to use
     * @returns {number} the xtd in radians unless a converter is given
     */
    static xtd(point, segment, converter=null) {
        return point.xtd_to(segment, converter);
    }

    /**
     * Returns a pseudo center points from a list of GeoPoints
     * @param {GeoPoint[]} geopoints
     * @param {?Object} options
     * @param {string} options.name
     * @param {string} options.description
     * @param {?function} options.normalizer
     * @returns {GeoPoint}
     */
    static getCenter(geopoints, options={}) {
        let howMany = geopoints.length,
            lam = 0,
            phi = 0,
            x = 0,
            y = 0,
            z = 0;

        for (let p of geopoints) {
            phi = p.philam.phi;
            lam = p.philam.lam;
            let cosphi = Math.cos(phi);
            x += cosphi * Math.cos(lam);
            y += cosphi * Math.sin(lam);
            z += Math.sin(phi);
        }
        x /= howMany;
        y /= howMany;
        z /= howMany;
        phi = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
        lam = Math.atan2(y, x);
        return new GeoPoint(new PhiLam(phi, lam).asLatLng, options || {});
    }

    /**
     * Get the spherical distance from another GeoPoint
     * @param {GeoPoint} other Geopoint
     * @param {?function} [converter=null] - by default distance in radians
     * @returns {number} the distance in the unit set by the converter
     */
    distanceTo(other, converter=null) {
        const phi1 = this.philam.phi;
        const lam1 = this.philam.lam;
        const phi2 = other.philam.phi;
        const lam2 = other.philam.lam;
        const sd = Math.acos(
            Math.sin(phi1) * Math.sin(phi2)
            + Math.cos(phi1) * Math.cos(phi2) * Math.cos(lam2 - lam1)
        );
        if (converter !== null) {
            return converter(sd);
        }
        return sd;
    }

    /**
     * Get the course to another point
     * @param {GeoPoint} other GeoPoint
     * @returns {number} the course in radian
     */
    course_to(other) {
        const phi1 = this.philam.phi;
        const lam1 = this.philam.lam;
        const phi2 = other.philam.phi;
        const lam2 = other.philam.lam;
        return fmod(
            Math.atan2(
                Math.sin(lam1 - lam2) * Math.cos(phi2),
                Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lam1 - lam2)
            ),
            2 * Math.PI
        );
    }

    /**
     * Given the segment AB; computes cross track error
     * @param {[GeoPoint, GeoPoint]} segment the segment AB
     * @param {?function} converter the converter to use otherwise result in radians
     * @returns {number} the distance in radian unless a converter is set
     */
    xtd_to(segment, converter=null) {
        const crs_ab = segment[0].course_to(segment[1]);
        const crs_ad = segment[0].course_to(this);
        const dist_ad = segment[0].distanceTo(this);
        const xtd = Math.asin(Math.sin(dist_ad) * Math.sin(crs_ad - crs_ab));
        if (converter !== null) {
            return converter(xtd);
        }
        return xtd;
    }

    /**
     * computes intermediate point at fraction of other on great circle
     * if distance=null, the required distance will be computed
     * @param {GeoPoint} other GeoPoint
     * @param {number} [fraction=0.5] - between 0 and 1
     * @param {?number} [distance=null] - optional pre-computed distance in radians
     * @returns {GeoPoint}
     */
    atFraction(other, fraction=0.5, distance=null) {
        const d = (distance === null) ? this.distanceTo(other) : distance;
        const phi1 = this.philam.phi;
        const lam1 = this.philam.lam;
        const phi2 = other.philam.phi;
        const lam2 = other.philam.lam;
        const a = Math.sin((1 - fraction) * d) / Math.sin(d);
        const b = Math.sin(fraction * d) / Math.sin(d);
        const x = a * Math.cos(phi1) * Math.cos(lam1) + b * Math.cos(phi2) * Math.cos(lam2);
        const y = a * Math.cos(phi1) * Math.sin(lam1) + b * Math.cos(phi2) * Math.sin(lam2);
        const z = a * Math.sin(phi1) + b * Math.sin(phi2);
        const phi = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
        const lam = Math.atan2(y, x);
        return new GeoPoint(new PhiLam(phi, lam).asLatLng);
    }

    /**
     * Return points forming a circle around current points
     * @param {int} radius distance in radians
     * @param {int} steps number of points in the circle
     * @param {function} converter converter to use for the radius
     */
    circle(radius, steps=64, converter=nm_to_rad) {
        if (converter) radius = converter(radius);
        const destination = (d, tc) => {
            const lat1 = this.philam.phi;
            const lon1 = this.philam.lam;
            const phi = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) *Math.sin(d) * Math.cos(tc));
            let lam = lon1;
            if (Math.cos(phi) !== 0) {
                lam = Math.asin(Math.sin(tc) * Math.sin(d) / Math.cos(phi))
                if (lon1 - lam < - Math.PI) lam = lon1 + Math.PI; // fix PPT ETOPS circle
                lam = fmod(lon1 - lam + Math.PI, 2 * Math.PI) - Math.PI;
            }
            return new GeoPoint(new PhiLam(phi, lam).asLatLng);
        }
        const points = [];
        for (let i = 0; i <= steps; i += 1) {
            points.push(destination(radius, i * 2 * Math.PI / steps));
        }
        //points.push(points[0]); // close circle
        return points;
    }

    equals(other){
        return (this.latitude.toFixed(6) === other.latitude.toFixed(6)
            && this.longitude.toFixed(6) === other.longitude.toFixed(6))
    }

    toJSON(){
        // TODO still useful or should return a geojson feature enclosing the point ?
        return {
            '__geopoint__': true,
            'latitude': this.latitude.toFixed(6),
            'longitude': this.longitude.toFixed(6),
            'name': this.name,
            'description': this.description
        };
    }
}

export {array_normalizer, dm_normalizer, arinc_normalizer, GeoPoint,dm2decimal,km_to_nm, km_to_rad, nm_to_rad, rad_to_km, rad_to_nm, rad_to_deg, NM, R};
