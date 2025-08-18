/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF369V_CYMX-LFPG_28Sep2021_1200z_OFP_5_0_1_A220.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF369V");
    expect(infos.callsign).toEqual("AFR369V");
    expect(infos.depICAO).toEqual("CYMX");
    expect(infos.depIATA).toEqual("YMX");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.destIATA).toEqual("CDG");
    expect(infos.ofp).toEqual("5/0/1");
    expect(infos.taxiTimeOUT).toEqual(11);
    expect(infos.taxiTimeIN).toEqual(20);
    expect(infos.flightTime).toEqual(444);
    expect(infos.blockTime).toEqual(475);
    expect(infos.ofpOUT.toISOString()).toEqual("2021-09-28T12:00:00.000Z");
    expect(infos.ofpOFF.toISOString()).toEqual("2021-09-28T12:11:00.000Z");
    expect(infos.ofpON.toISOString()).toEqual("2021-09-28T19:35:00.000Z");
    expect(infos.ofpIN.toISOString()).toEqual("2021-09-28T19:55:00.000Z");
    expect(infos.scheduledIN.toISOString()).toEqual("2021-09-28T20:25:00.000Z");
    expect(infos.ofpTextDate).toEqual("28Sep2021");
    expect(infos.ralts).toEqual(['CYYR', 'BIKF']);
    expect(infos.alternates).toEqual(["LFPO"]);
    expect(infos.aircraftType).toEqual("220");
    expect(infos.EEP.name).toEqual("CYYR");
    expect(infos.EXP.name).toEqual("BIKF");
    expect(infos.raltPoints.map(v => v.name)).toEqual(['CYYR','BIKF']);
    expect(infos.maxETOPS).toEqual(120);
    expect(infos.payload).toEqual(3.0);
    expect(infos.tripFuel).toEqual(14.918);
    expect(infos.blockFuel).toEqual(17.136);
    expect(infos.groundDistance).toEqual(3303);
    expect(infos.minFuelMarginETOPS).toBeCloseTo(5.4, 3);
    expect(infos.inFlightReleased).toBeFalsy();
    expect(infos.flightTypeAircraft).toEqual('MC');
    expect(infos.flightTypePNT).toEqual('LT');
  });

test('wptNamesEET', () => {
  let points = ofp.route.points;
  const results = ofp.wptNamesEET(ofp.wptCoordinates());
  expect(results.length).toEqual(points.length);
});
