/* eslint-env jest */
/* eslint-disable sort-imports */

import {Ofp} from "../src/modules/ofp"
const ofpText = "_PDFJS_AF 681 KATL/LFPG 11Mar2020/2235zReleased: 11Mar/1724z3Main OFP (Long copy #1)OFP 6/0/1 ATC FLIGHT PLAN (FPL-AFR681-IS -B77W/ -KATL2235 -LFPG0724 LFPO ) FLIGHT SUMMARY 0012 TAXI IN Generated";
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flight).toEqual("AF681");
    expect(infos.departure).toEqual("KATL");
    expect(infos.destination).toEqual("LFPG");
    expect(infos.ofp).toEqual("6/0/1");
    expect(infos.datetime.toISOString()).toEqual("2020-03-11T22:35:00.000Z");
    expect(infos.takeoff.toISOString()).toEqual("2020-03-11T22:47:00.000Z");
    expect(infos.landing.toISOString()).toEqual("2020-03-12T06:11:00.000Z");
    expect(infos.station).toBeNull();
    expect(infos.date).toEqual("11Mar2020");
    expect(infos.duration).toEqual([7, 24]);
    expect(infos.taxitime).toEqual(12);
    expect(infos.ralts).toEqual([]);
    expect(infos.alternates).toEqual([]);
    expect(infos.aircraft).toEqual("773");
    expect(infos.EEP).toEqual(null);
    expect(infos.EXP).toEqual(null);
    expect(infos.raltPoints.map(v => v.name)).toEqual([]);
    expect(infos.ETOPS).toEqual(0);
    expect(ofp.description).toEqual('AF681 KATL-LFPG 11Mar2020 22:35z OFP 6/0/1');
    //expect()
  });
