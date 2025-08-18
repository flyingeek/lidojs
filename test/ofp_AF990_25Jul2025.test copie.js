/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF990_LFPG_FAOR_25Jul2025_1910z_OFP_8_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF990");
    expect(infos.callsign).toEqual("AFR990");
    expect(infos.depICAO).toEqual("LFPG");
    expect(infos.depIATA).toEqual("CDG");
    expect(infos.destICAO).toEqual("FAOR");
    expect(infos.destIATA).toEqual("JNB");
    expect(infos.ofp).toEqual("8/0/1");
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
