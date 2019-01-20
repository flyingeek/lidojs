/*
latitude is the latitude in degrees
longitude is the longitude in degrees

rlat is the latitude in radians (lambda is a reserved name in python)
phi is the longitude in radians

LatLng is the base object when using degrees
LatPhi is the base object when using lradians
*/

/**
 * LatLng
 *
 * @property {number} latitude - latitude in degrees
 * @property {number} longitude - longitude in degrees
 * @property {LatPhi} asLatPhi - convert to a LatPhi
 */
class LatLng {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // eslint-disable-next-line class-methods-use-this
    get [Symbol.toStringTag]() {
        return 'LatLng';
    }

    /**
     *Degrees Minutes representation of LatLng
     * exemple: N09W020.3
     * @returns {String}
     */
    get asDM() {
        const format = function (v, letters = "NS") {
            let value = Math.abs(v);
            let degrees = Math.floor(value);
            let rest = (value - degrees) * 60;
            let minutes = Math.floor(rest);
            let cents = Math.round((rest - minutes) * 10);
            if (cents >= 10) {
                cents = 0;
                minutes += 1;
            }
            if (minutes >= 60) {
                minutes = 0;
                degrees += 1;
            }
            let letter = "",
                padding = 2;
            if (letters === 'NS') {
                letter = (v >= 0) ? letters[0] : letters[1];
            } else {
                letter = (v > 0) ? letters[0] : letters[1];
                padding = 3;
            }
            return [
                letter,
                degrees.toFixed(0).padStart(padding, "0"),
                minutes.toFixed(0).padStart(2, "0"),
                '.' + cents.toFixed(0)
            ].join('');
        }
        return format(this.latitude) + format(this.longitude, 'EW');
    }

    get asLatPhi() {
        const [rlat, phi] = [this.latitude, this.longitude].map((d) => d * Math.PI / 180);
        return new LatPhi(rlat, phi);
    }
}

/**
 * LatPhi
 *
 * @property {number} rlat - latitude in radians
 * @property {number} phi - longitude in radians
 * @property {LatLng} asLatLng - convert to a LatLng
 */
class LatPhi {
    constructor(rlat, phi) {
        this.rlat = rlat;
        this.phi = phi;
    }

    // eslint-disable-next-line class-methods-use-this
    get [Symbol.toStringTag]() {
        return 'LatPhi';
    }

    /**
     * asLatLng return a new corresponding LatLng object
     * @returns {LatLng}
     */
    get asLatLng() {
        const [latitude, longitude] = [this.rlat, this.phi].map((r) => r * 180 / Math.PI);
        return new LatLng(latitude, longitude);
    }
}

//helper for python like code
const latphi2latlng = (latphi) => latphi.asLatLng;
const latlng2dm = (latlng) => latlng.asDM;

export {
    LatLng, LatPhi, latphi2latlng, latlng2dm
};
