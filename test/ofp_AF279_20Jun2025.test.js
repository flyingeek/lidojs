/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF279_RJTT_LFPG_20Jun2025_OFP_46_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF279");
    expect(infos.callsign).toEqual("AFR279");
    expect(infos.depICAO).toEqual("RJTT");
    expect(infos.depIATA).toEqual("HND");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("46/0/1");
});


test('estimates', () => {
    let points = ofp.route.points;
    let estimates = ofp.wptNamesEET(points);
    expect(estimates.length).toEqual(points.length);
});
