/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"
//import {GeoGridIndex} from "../src/modules/geoindex";
//import {ogimetData} from "../src/modules/ogimet";
//import wmo from "../dist/wmo.json";

const ofpText = loadDataAsString("AF275_RJAA_LFPG_08Jun2022_00:35z.txt");
const ofp = new Ofp(ofpText);
//const wmoGrid = new GeoGridIndex();
//wmoGrid.data = wmo;
//const ogiData = ogimetData(ofp, wmoGrid);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF275");
    expect(infos.callsign).toEqual("AFR275");
    expect(infos.depICAO).toEqual("RJAA");
    expect(infos.depIATA).toEqual("NRT");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("31/0/1");
});
// test("ogiment uses PASY", () => {
//   expect(ogiData.route.name).toEqual('Route Gramet AF275 RJAA-LFPG 08Jun22 24:54z OFP 31/0/1');
//   expect(ogiData.route.description.startsWith('RJAA RJAK RJAH 47648 PASY PAOM PAOT PABR')).toBeTruthy();
// })

test('estimates', () => {
    let points = ofp.route.points;
    let estimates = ofp.wptNamesEET(points)
    expect(estimates.length).toEqual(points.length);
});
