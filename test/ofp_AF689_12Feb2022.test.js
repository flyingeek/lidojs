/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF689_KATL_LFPG_22Feb2022_0115z_OFP_11_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF689");
    expect(infos.callsign).toEqual("AFR689");
    expect(infos.depICAO).toEqual("KATL");
    expect(infos.depIATA).toEqual("ATL");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("11/0/1");
});


test('tracks', () => {
    let tracks = ofp.tracks;
    expect(tracks.length).toEqual(6);
    expect(tracks[1].infos.direction).toEqual("EAST");
});
