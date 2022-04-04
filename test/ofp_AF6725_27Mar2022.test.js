/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF6725_RJAA_LFPG_27Mar2022_1420z_OFP_3_3_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF6725");
    expect(infos.callsign).toEqual("AFR6725");
    expect(infos.depICAO).toEqual("RJAA");
    expect(infos.depIATA).toEqual("NRT");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("3/3/1");
});


test('estimates', () => {
    let points = ofp.route.points;
    let estimates = ofp.wptNamesEET(points)
    expect(estimates.length).toEqual(points.length);
});
