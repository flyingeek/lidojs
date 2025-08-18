/* eslint-env jest */
/* eslint-disable sort-imports */
//import {Route} from "../src";
import {loadDataAsString} from "./utils";
import {Ofp} from "../src/modules/ofp";

const ofpText = loadDataAsString("AF054_LFPG_KIAD_03Apr2021_inFlightReleased.txt");
const ofp = new Ofp(ofpText);

test("loadOFP", () => {
    expect(ofpText).toMatch(/^_PDFJS_/u);
});

test("infos", () => {
    const infos = ofp.infos;
    expect(infos.rawFPL).toEqual(
        "(FPL-AFR054-IS -B77W/H-SDE2E3FGHIJ3J5M1P2RWXYZ/LB1D1 -LFPG1140 -M083F360 DCT 48N015W 48N020W 47N030W/M083F380 45N040W 44N050W 42N060W DCT DOVEY/N0484F380 DCT JFK DCT ARD DCT MUDNE V419 MXE HYPER8 -KIAD0625 KBWI -PBN/A1B1C1D1L1O1S2 DAT/1FANSP2PDC CPDLCX SUR/260B RSP180 DOF/210403 REG/FGSQA EET/48N015W0030 48N020W0055 CZQX0147 KZWY0238 44N050W0328 42N060W0427 KZNY0508 KZBW0520 KZNY0546 KZDC0616 SEL/EJAL CODE/394A00 OPR/AFR PER/D RALT/EINN CYYT RVR/075 RMK/ACAS TCAS)"
    );
    expect(infos.flightNo).toEqual("AF054");
    expect(infos.inFlightReleased).toBeTruthy();
    expect(infos.inFlightStart).toEqual('ETIKI');
    expect(infos.depICAO).toEqual('LFPG');
    expect(infos.depIATA).toEqual('CDG');
    expect(infos.taxiTimeOUT).toEqual(0);
    expect(infos.ofpOUT.toISOString()).toEqual("2021-04-03T11:40:00.000Z");
    expect(infos.ofpOFF.toISOString()).toEqual("2021-04-03T13:01:00.000Z");
    expect(infos.ofpON.toISOString()).toEqual("2021-04-03T19:36:00.000Z");
    expect(infos.ofpIN.toISOString()).toEqual("2021-04-03T19:41:00.000Z");
    expect(infos.blockTime).toEqual(481); //8h01
    expect(infos.flightTime).toEqual(395); //6h35
    expect(infos.flightTypeAircraft).toEqual('LC');
});

test("wptCoordinates", () => {
    expect(ofp.wptCoordinates().map((g) => g.name)).toEqual(
        [
            'ETIKI', 'N4800.0W01500.0',
            'N4800.0W02000.0', 'N4700.0W03000.0',
            'N4500.0W04000.0', 'N4400.0W05000.0',
            'N4200.0W06000.0', 'DOVEY',
            'JFK', 'ARD',
            'MUDNE', 'FROSE',
            'MXE', 'DELRO',
            'LIRCH', 'BINNS',
            'HYPER', 'SIGBE',
            'MOWAT', 'HUSEL',
            'YACKK', 'TICON',
            'KIAD'
        ]
    );
});

test('wptNamesEET', () => {
  let points = ofp.route.points;
  const results = ofp.wptNamesEET(ofp.wptCoordinates());
  expect(results.length).toEqual(points.length);
});


test("lidoRoute", () => {
    expect(ofp.lidoRoute().join(" ")).toEqual("ETIKI N4800.0W01500.0 N4800.0W02000.0 N4700.0W03000.0 N4500.0W04000.0 N4400.0W05000.0 N4200.0W06000.0 DOVEY DCT JFK DCT ARD DCT MUDNE V419 MXE N3957.9W07637.5 N3949.6W07655.3 N3947.1W07700.7 N3941.0W07713.5 N3924.6W07721.8 N3916.0W07721.6 N3909.9W07721.5 N3854.5W07721.4 N3840.8W07721.7 KIAD KBWI EINN CYYT");
});
