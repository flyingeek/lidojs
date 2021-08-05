/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF681_KATL_LFPG_11Mar2020_2235z_OFP_6_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF681");
    expect(infos.callsign).toEqual("AFR681");
    expect(infos.depICAO).toEqual("KATL");
    expect(infos.depIATA).toEqual("ATL");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("6/0/1");
    expect(infos.taxiTimeOUT).toEqual(16);
    expect(infos.taxiTimeIN).toEqual(16);
    expect(infos.flightTime).toEqual(454);
    expect(infos.blockTime).toEqual(486);
    expect(infos.ofpOUT.toISOString()).toEqual("2020-03-11T22:35:00.000Z");
    expect(infos.ofpOFF.toISOString()).toEqual("2020-03-11T22:51:00.000Z");
    expect(infos.ofpON.toISOString()).toEqual("2020-03-12T06:25:00.000Z");
    expect(infos.ofpIN.toISOString()).toEqual("2020-03-12T06:41:00.000Z");
    expect(infos.scheduledIN.toISOString()).toEqual("2020-03-12T06:55:00.000Z");
    expect(infos.ofpTextDate).toEqual("11Mar2020");
    expect(infos.duration).toEqual([7, 34]);
    expect(infos.ralts).toEqual(['LPLA', 'EINN']);
    expect(infos.alternates).toEqual(["LFPO"]);
    expect(infos.aircraftType).toEqual("773");
    expect(infos.EEP.name).toEqual("CYYT");
    expect(infos.EXP.name).toEqual("EINN");
    expect(infos.raltPoints.map(v => v.name)).toEqual(['LPLA','EINN']);
    expect(infos.maxETOPS).toEqual(180);
    expect(infos.payload).toEqual(29.500);
    expect(infos.tripFuel).toEqual(51.013);
    expect(infos.blockFuel).toEqual(58.869);
  });

test('wptNamesEET', () => {
  const results = ofp.wptNamesEET(ofp.wptCoordinates());
  expect(results.length === 0).toBeFalsy();
});
