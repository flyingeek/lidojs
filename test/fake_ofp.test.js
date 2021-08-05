/* eslint-env jest */
/* eslint-disable sort-imports */

import {Ofp} from "../src/modules/ofp"
const ofpText = "_PDFJS_AF 681 KATL/LFPG 11Mar2020/2235zReleased: 11Mar/1724z3Main OFP (Long copy #1)OFP 6/0/1 ATC FLIGHT PLAN (FPL-AFR681-IS -B77W/ -KATL2235 -LFPG0724 LFPO ) FLIGHT SUMMARY 0012 TAXI IN Generated";
const ofp = new Ofp(ofpText);

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.flightNo).toEqual("AF681");
    expect(infos.callsign).toEqual("AFR681");
    expect(infos.depICAO).toEqual("KATL");
    expect(infos.destICAO).toEqual("LFPG");
    expect(infos.ofp).toEqual("6/0/1");
    expect(infos.ofpOUT.toISOString()).toEqual("2020-03-11T22:35:00.000Z");
    expect(infos.ofpOFF.toISOString()).toEqual("2020-03-11T22:47:00.000Z");
    expect(infos.ofpON.toISOString()).toEqual("2020-03-12T06:11:00.000Z");
    expect(infos.ofpIN.toISOString()).toEqual("2020-03-12T06:26:00.000Z");
    expect(infos.scheduledIN).toBeNull();
    expect(infos.ofpTextDate).toEqual("11Mar2020");
    expect(infos.duration).toEqual([7, 24]);
    expect(infos.flightTime).toEqual(444);
    expect(infos.blockTime).toEqual(471);
    expect(infos.taxiTimeOUT).toEqual(12);
    expect(infos.taxiTimeIN).toEqual(15);
    expect(infos.ralts).toEqual([]);
    expect(infos.alternates).toEqual([]);
    expect(infos.aircraftType).toEqual("773");
    expect(infos.EEP).toEqual(null);
    expect(infos.EXP).toEqual(null);
    expect(infos.raltPoints.map(v => v.name)).toEqual([]);
    expect(infos.maxETOPS).toEqual(0);
    expect(ofp.description).toEqual('AF681 KATL-LFPG 11Mar2020 22:35z OFP 6/0/1');
    //expect()
  });
