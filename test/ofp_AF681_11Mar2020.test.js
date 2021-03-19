/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString} from "./utils"
import {Ofp} from "../src/modules/ofp"

const ofpText = loadDataAsString("AF681_KATL_LFPG_11Mar2020_2235z_OFP_6_0_1.txt");
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flight).toEqual("AF681");
    expect(infos.departure).toEqual("KATL");
    expect(infos.destination).toEqual("LFPG");
    expect(infos.ofp).toEqual("6/0/1");
    expect(infos.datetime.toISOString()).toEqual("2020-03-11T22:35:00.000Z");
    expect(infos.takeoff.toISOString()).toEqual("2020-03-11T22:51:00.000Z");
    expect(infos.landing.toISOString()).toEqual("2020-03-12T06:25:00.000Z");
    expect(infos.date).toEqual("11Mar2020");
    expect(infos.duration).toEqual([7, 34]);
    expect(infos.taxitime).toEqual(16);
    expect(infos.ralts).toEqual(['LPLA', 'EINN']);
    expect(infos.alternates).toEqual(["LFPO"]);
    expect(infos.aircraft).toEqual("773");
    expect(infos.EEP.name).toEqual("CYYT");
    expect(infos.EXP.name).toEqual("EINN");
    expect(infos.raltPoints.map(v => v.name)).toEqual(['LPLA','EINN']);
    expect(infos.ETOPS).toEqual(180);
  });
