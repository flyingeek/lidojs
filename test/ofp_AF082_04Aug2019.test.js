/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF082_LFPG_KSFO_04Aug2019_1355z_OFP_6_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF082");
    expect(infos.callsign).toEqual("AFR082");
    expect(infos.depICAO).toEqual("LFPG");
    expect(infos.depIATA).toEqual("CDG");
    expect(infos.destICAO).toEqual("KSFO");
    expect(infos.destIATA).toEqual("SFO");
    expect(infos.taxiTimeOUT).toEqual(25);
    expect(infos.taxiTimeIN).toEqual(13);
    expect(infos.flightTime).toEqual(638);
    expect(infos.blockTime).toEqual(676);
    expect(infos.ofpOUT.toISOString()).toEqual("2019-08-04T13:55:00.000Z");
    expect(infos.ofpOFF.toISOString()).toEqual("2019-08-04T14:20:00.000Z");
    expect(infos.ofpON.toISOString()).toEqual("2019-08-05T00:58:00.000Z");
    expect(infos.ofpIN.toISOString()).toEqual("2019-08-05T01:11:00.000Z");
    expect(infos.scheduledIN.toISOString()).toEqual("2019-08-05T01:20:00.000Z");
    expect(infos.ralts).toEqual(['BIKF', 'CYQX', 'CYEG']);
    expect(infos.alternates).toEqual(["KOAK"]);
    expect(infos.aircraftType).toEqual("773");
    expect(infos.EEP.name).toEqual("BIKF");
    expect(infos.EXP.name).toEqual("CYEG");
    expect(infos.raltPoints.map(v => v.name)).toEqual(['BIKF','CYQX', 'CYEG']);
    expect(infos.maxETOPS).toEqual(180);
    expect(infos.payload).toEqual(31.168);
    expect(infos.tripFuel).toEqual(79.501);
    expect(infos.blockFuel).toEqual(86.946);
    expect(infos.minFuelMarginETOPS).toBeCloseTo(7.4, 3);
    expect(infos.inFlightReleased).toBeFalsy();
    expect(infos.flightTypeAircraft).toEqual('LC');
  });
  test('wptNamesEET', () => {
  let points = ofp.route.points;
  const results = ofp.wptNamesEET(ofp.wptCoordinates());
  expect(results.length).toEqual(points.length);
  });
