/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF022_LFPG-KJFK_12Nov2021_0715z_OFP_6_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF022");
    expect(infos.callsign).toEqual("AFR022");
    expect(infos.depICAO).toEqual("LFPG");
    expect(infos.depIATA).toEqual("CDG");
    expect(infos.destICAO).toEqual("KJFK");
    expect(infos.destIATA).toEqual("JFK");
    expect(infos.ofp).toEqual("6/0/1");
});


test('tracks', () => {
    let tracks = ofp.tracks;//?
    expect(tracks.length).toEqual(14);
    expect(tracks[0].infos.direction).toEqual("EAST");
    expect(tracks[9].infos.direction).toEqual("WEST");
});
