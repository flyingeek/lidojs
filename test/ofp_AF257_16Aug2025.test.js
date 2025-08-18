/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF257_WSSS-LFPG_16Aug2025_1430z_OFP_24_0_1_EXPORT.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF257");
    expect(infos.callsign).toEqual("AFR257");
    expect(infos.depICAO).toEqual("WSSS");
    expect(infos.depIATA).toEqual("SIN");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("24/0/1");
});


test('estimates', () => {
    let points = ofp.route.points;
    let estimates = ofp.wptNamesEET(points);
    //console.dir(estimates);
    expect(estimates.length).toEqual(points.length);
    let previousEet = 0;
    for (let [, eet,] of estimates) {
      expect(eet).toBeGreaterThanOrEqual(previousEet);
      previousEet = eet;
    }
});
