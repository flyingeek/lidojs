/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF267_ICN_CDG_06DEC2022_OFP_7_1_1_RCF.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF267");
    expect(infos.callsign).toEqual("AFR267");
    expect(infos.depICAO).toEqual("RKSI");
    expect(infos.depIATA).toEqual("ICN");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("7/1/1");
});


test('estimates', () => {
    let points = ofp.route.points; /*?*/
    let estimates = ofp.wptNamesEET(points);
    expect(estimates.length).toEqual(points.length);
    expect(estimates[estimates.length-1][1]).toEqual(858);
});
