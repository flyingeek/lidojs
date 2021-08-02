/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF082_LFPG_KSFO_04Aug2019_1355z_OFP_6_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flight).toEqual("AF082");
    expect(infos.departure).toEqual("LFPG");
    expect(infos.dep3).toEqual("CDG");
    expect(infos.destination).toEqual("KSFO");
    expect(infos.taxitime).toEqual(25);
    expect(infos.taxitime2).toEqual(13);
    expect(infos.takeoff.toISOString()).toEqual("2019-08-04T14:20:00.000Z");
    expect(infos.landing.toISOString()).toEqual("2019-08-05T00:58:00.000Z");
    expect(infos.datetime2.toISOString()).toEqual("2019-08-05T01:11:00.000Z");
    expect(infos.STA.toISOString()).toEqual("2019-08-05T01:20:00.000Z");
    expect(infos.des3).toEqual("SFO");
    expect(infos.ralts).toEqual(['BIKF', 'CYQX', 'CYEG']);
    expect(infos.alternates).toEqual(["KOAK"]);
    expect(infos.aircraft).toEqual("773");
    expect(infos.EEP.name).toEqual("BIKF");
    expect(infos.EXP.name).toEqual("CYEG");
    expect(infos.raltPoints.map(v => v.name)).toEqual(['BIKF','CYQX', 'CYEG']);
    expect(infos.ETOPS).toEqual(180);
    expect(infos.payload).toEqual(31.168);
    expect(infos.tripFuel).toEqual(79.501);
    expect(infos.blockFuel).toEqual(86.946);
  });
  test('wptNamesEET', () => {
    const results = ofp.wptNamesEET(ofp.wptCoordinates());
    expect(results.length === 0).toBeFalsy();
  });
