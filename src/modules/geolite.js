/*
latitude is the latitude in degrees
longitude is the longitude in degrees

lam is the longitude in radians (lambda is a reserved name in python)
phi is the latitude in radians

LatLng is the base object when using degrees
PhiLam is the base object when using lradians
*/

/**
 * LatLng
 *
 * @property {number} latitude - latitude in degrees
 * @property {number} longitude - longitude in degrees
 * @property {PhiLam} PhiLam - convert to a PhiLam
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

    /**
     *Degrees Minutes representation of LatLng
     * exemple: N09W020
     * @returns {String}
     */
    get asRoundedDM() {
        const format = function (v, letters = "NS") {
            let value = Math.abs(v);
            let degrees = Math.floor(value);
            let rest = (value - degrees) * 60;
            let minutes = Math.floor(rest);
            let cents = Math.round((rest - minutes) * 10);
            if (cents > 5) {
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
            ].join('');
        }
        return format(this.latitude) + format(this.longitude, 'EW');
    }

    get asPhiLam() {
        const [phi, lam] = [this.latitude, this.longitude].map((d) => d * Math.PI / 180);
        return new PhiLam(phi, lam);
    }
}

/**
 * PhiLam
 *
 * @property {number} phi - latitude in radians
 * @property {number} lam - longitude in radians
 * @property {LatLng} asLatLng - convert to a LatLng
 */
class PhiLam {
    constructor(phi, lam) {
        this.phi = phi;
        this.lam = lam;
    }

    // eslint-disable-next-line class-methods-use-this
    get [Symbol.toStringTag]() {
        return 'PhiLam';
    }

    /**
     * asLatLng return a new corresponding LatLng object
     * @returns {LatLng}
     */
    get asLatLng() {
        const [latitude, longitude] = [this.phi, this.lam].map((r) => r * 180 / Math.PI);
        return new LatLng(latitude, longitude);
    }
}

//helper for python like code
const philam2latlng = (philam) => philam.asLatLng;
const latlng2dm = (latlng) => latlng.asDM;
const latlng2roundeddm = (latlng) => latlng.asRoundedDM;

export {
    LatLng, PhiLam, philam2latlng, latlng2dm, latlng2roundeddm
};
