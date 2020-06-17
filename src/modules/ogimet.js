/* eslint-disable max-lines-per-function */
import {km_to_rad, rad_to_km} from "./geopoint";
import {Route} from "./route";

/**
 * Compute the Ogimet Route
 * @param {editolido.Route} route the route to find the ogimet route for
 * @param {number} segmentSize the result is split to this length
 * @param {string} name the name of the returned route
 * @param {string} description the description of the returned route
 */
export function ogimetRoute(wmoGrid, route, {name="", description="", segmentSize=300, algorithm='xtd'} = {}) {
    const neighbourRadius = (rad_to_km(wmoGrid.gridSize) / 2.0) - 0.1

    const getNeighbour = (point) => {
        let neighbours = [...wmoGrid.getNearestPoints(point, neighbourRadius)];
        if (neighbours.length > 0) {
            neighbours = neighbours.sort((a, b) => a[1] - b[1]);
            if (neighbours.map((a) => a[0].name).indexOf(point.name) >= 0) {
                return [point, 0];
            }
            return [neighbours[0][0], neighbours[0][1]];
        }
        return [null, null];
    };

    const findStrategic = (start, end, results) => {
        for (let k = end - 1; k > start; k -= 1) {
            const o_xtd = results[k].ogimet.xtd_to(
                [results[k].fpl, results[k + 1].fpl]
            );
            const f_xtd = results[k].fpl.xtd_to(
                [results[start].ogimet, results[end].ogimet]
            )
            if (Math.abs(f_xtd) > Math.abs(o_xtd)) {
                return k;
            }
        }
        return null;
    };

    const filterByXtd = (results) => {
        const res = [results[0]];
        let i = -1;
        while (i < results.length - 1) {
            i += 1;
            let j = i + 2;
            while (j <= results.length - 1) {
                let k = findStrategic(i, j, results);
                if (k === null) {
                    j += 1;
                } else {
                    if (res.map((r) => r.ogimet.name).indexOf(results[k].ogimet.name) < 0) {
                        res.push(results[k]);
                    }
                    i = k - 1;
                    break;
                }
            }
        }
        res.push(results[results.length - 1]);
        if (res.length < results.length) {
            return filterByXtd(res);
        }
        return res;
    };

    // eslint-disable-next-line no-unused-vars
    const lowestCrsIndex = (results) => {
        let bestDiff = 0;
        let best = null;
        let maxi = results.length - 1;
        for (let i = 1; i < maxi; i += 1) {
            const diff = Math.abs(
                results[i - 1].ogimet.course_to(results[i].ogimet)
                - results[i - 1].ogimet.course_to(results[i+1].ogimet)
            );
            if (best === null || diff < bestDiff) {
                best = i;
                bestDiff = diff;
            }
        }
        return best;
    };

    const lowestXtdIndex = (results) => {
        let bestXtd = 0;
        let best = null;
        let maxi = results.length - 1;
        for (let i = 1; i < maxi; i += 1) {
            const xtd = Math.abs(
                results[i].fpl.xtd_to([results[i - 1].ogimet, results[i + 1].ogimet])
            );
            if (best === null || xtd < bestXtd) {
                best = i;
                bestXtd = xtd;
            }
        }
        return best;
    }

    let ogimetResults = [];
    const o_index = {};
    for (const p of route.split(60, {'converter': km_to_rad, 'preserve': true}).points) {
        const [neighbour, x] = getNeighbour(p);
        if (neighbour !== null) {
            if (neighbour.name in o_index) {
                if (o_index[neighbour.name][0] > x) {
                    o_index[neighbour.name] = [x, p];
                }
            } else {
                o_index[neighbour.name] = [x, p];
            }
            ogimetResults.push({'fpl': p, 'ogimet': neighbour});
        }
    }

    // eslint-disable-next-line eqeqeq
    ogimetResults = ogimetResults.filter((r) => o_index[r.ogimet.name][1] == r.fpl);
    ogimetResults = filterByXtd(ogimetResults);
    //console.log(ogimetResults.length);
    const reduceFn = (algorithm === 'xtd' ? lowestXtdIndex: lowestCrsIndex);
    while (ogimetResults.length > 21) {
        const idx = reduceFn(ogimetResults);
        ogimetResults = ogimetResults.slice(0, idx).concat(ogimetResults.slice(idx + 1));
    }
    return new Route(ogimetResults.map((r) => r.ogimet))
                .split(segmentSize, {'preserve': true, 'name': name, 'description': description});
}

/**
 * Computes ogimet url
 * @param {editolido.OFP} ofp the OFP
 * @param {editolido.GeoGridIndex} wmoGrid  the loaded Grid
 */
export function ogimetData(ofp, wmoGrid, algorithm="xtd") {
    // timestamp for departure
    const taxitime = ofp.infos['taxitime'];
    const ts = (ofp.infos['datetime'].valueOf() / 1000) + (taxitime * 60);
    const now_ts = (new Date()).valueOf() / 1000;
    const tref = Math.round(Math.max(ts, now_ts)); //for old ofp timeref=now
    const trefOfp = Math.round(ts);
    const dateref = new Date(tref * 1000);
    // https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
    const dateTimeFormat = new Intl.DateTimeFormat('en', {'year': '2-digit', 'month': 'short', 'day': '2-digit', 'hour': '2-digit', 'minute': '2-digit'});
    const [{'value': month},,{'value': day},,{'value': year},,{'value': hour},,{'value': minute}] = dateTimeFormat.formatToParts(dateref);
    const name = `Route Gramet ${ofp.infos['flight']} ${ofp.infos['departure']}-${ofp.infos['destination']} ${day}${month}${year} ${hour}:${minute}z OFP ${ofp.infos['ofp']}`;
    let hini = 0;
    let hfin = ofp.infos['duration'][0] + 1;
    const levels = [...ofp.infos['rawfpl'].matchAll(/F(\d{3})\s/ug)].map(v => (v[1]*1));
    let fl = 300;
    if (levels && levels.length) {
        fl = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    }
    const route = ogimetRoute(wmoGrid, ofp.route,{name, algorithm});
    const labels = route.points.filter(p => p.name !== "").map(p => p.name);
    route.description = labels.join(' ');
    const url = `http://www.ogimet.com/display_gramet.php?lang=en&hini=${hini}&tref=${tref}&hfin=${hfin}&fl=${fl}&hl=3000&aero=yes&wmo=${labels.join('_')}&submit=submit`;
    const proxy = `${hini}-${trefOfp}-${hfin}-${fl}-${labels.join('_')}`;
    return {tref, trefOfp, name, route, 'wmo': labels, url, proxy};
}
