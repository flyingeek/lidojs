/* eslint-env jest */
/* eslint-disable sort-imports */
import {Route} from "../src";
import {loadDataAsString} from "./utils";
import {Ofp} from "../src/modules/ofp";
import {ogimetData} from "../src/modules/ogimet";
import {GeoGridIndex} from "../src/modules/geoindex";

const ofpText = loadDataAsString("AF010_LFPG-KJFK_27Sep2019_1450z_OFP_6_nvp_pdfjs.txt");
const ofp = new Ofp(ofpText);

test("loadOFP", () => {
  expect(ofpText).toMatch(/^_PDFJS_/u);
});

test("infos", () => {
  const infos = ofp.infos;
  expect(infos.rawfpl).toEqual(
    "(FPL-AFR010-IS -A388/H-SDE2E3GHIJ4J5M1P2RWXYZ/LB1D1 -LFPG1450 -N0480F260 ATREX3A ATREX UT225 VESAN UL613 SOVAT/N0502F380 UL613 SANDY UN601 LESTA UP6 RODOL UM65 TENSO L603 REMSI DCT GOMUP/M086F380 NATB LOMSI/N0498F380 DCT DANOL DCT ENE J121 SEY PARCH3 -KJFK0705 KBOS -PBN/A1B1C1D1L1O1S2 DAT/1FANSP2PDC SUR/RSP180 DOF/190927 REG/FHPJE EET/EGTT0019 EGPX0104 EGGX0129 58N020W0209 CZQX0249 57N040W0329 55N050W0415 LOMSI0449 CZUL0504 CZQM0546 KZBW0608 SEL/CPHQ CODE/39BD24 OPR/AFR PER/C RVR/075 RMK/ACAS TCAS)"
  );
  expect(infos.flight).toEqual("AF010");
  expect(infos.departure).toEqual("LFPG");
  expect(infos.dep3).toEqual("CDG");
  expect(infos.destination).toEqual("KJFK");
  expect(infos.des3).toEqual("JFK");
  expect(infos.ofp).toEqual("6");
  expect(infos.taxitime).toEqual(24);
  expect(infos.taxitime2).toEqual(51);
  expect(infos.datetime.toISOString()).toEqual("2019-09-27T14:50:00.000Z");
  expect(infos.takeoff.toISOString()).toEqual("2019-09-27T15:14:00.000Z");
  expect(infos.landing.toISOString()).toEqual("2019-09-27T22:29:00.000Z");
  expect(infos.datetime2.toISOString()).toEqual("2019-09-27T23:20:00.000Z");
  expect(infos.date).toEqual("27Sep2019");
  expect(infos.duration).toEqual([7, 15]);
  expect(infos.ralts).toEqual([]);
  expect(infos.alternates).toEqual(["KBOS"]);
  expect(infos.aircraft).toEqual("380");
});

test("fpl", () => {
  expect(ofp.fpl())
    .toEqual([
      "LFPG", "ATREX3A", "ATREX", "UT225", "VESAN", "UL613", "SOVAT/N0502F380",
      "UL613", "SANDY", "UN601", "LESTA", "UP6", "RODOL", "UM65", "TENSO", "L603",
      "REMSI", "DCT", "GOMUP/M086F380", "NATB", "LOMSI/N0498F380", "DCT", "DANOL",
      "DCT", "ENE", "J121", "SEY", "PARCH3", "KJFK"]);
});

test("fplRoute", () => {
  expect(ofp.fplRoute).toEqual(
    ["LFPG", "ATREX3A", "ATREX", "UT225", "VESAN", "UL613", "SOVAT",
      "UL613", "SANDY", "UN601", "LESTA", "UP6", "RODOL", "UM65", "TENSO",
      "L603", "REMSI", "DCT", "GOMUP", "NATB", "LOMSI", "DCT", "DANOL", "DCT",
      "ENE", "J121", "SEY", "PARCH3", "KJFK"]
  );
});

test("route", () => {
  expect(ofp.route).toBeInstanceOf(Route);
});

test("wptCoordinates", () => {
  expect(ofp.wptCoordinates().map((g) => g.name)).toEqual(
    ["LFPG", "PG270", "PG276", "ATREX", "VESAN", "RATUK", "SOVAT",
      "SANDY", "DET", "BPK", "POTON", "BEDFO", "EBOTO", "PIPIN", "LESTA",
      "TUMTI", "RODOL", "TENSO", "BELOX", "REMSI", "GOMUP", "N5800.0W02000.0",
      "N5800.0W03000.0", "N5700.0W04000.0", "N5500.0W05000.0", "LOMSI", "DANOL",
      "ENE", "BURDY", "SEY", "PARCH", "CCC", "ROBER", "CRAIL", "CAPIT", "KJFK"]
  );
});

test("wptCoordinatesAlternate", () => {
  expect(ofp.wptCoordinatesAlternate().map((g) => g.name)).toEqual(
    ["KJFK", "JFK", "GPOLE", "NEWES", "BAWLL", "RAALF", "ORW", "OUTTT",
      "PVD", "KRANN", "KBOS"]
  );
});

test("trackParser", () => {
  expect(ofp.trackParser().length).toEqual(5);
});

test("tracks", () => {
  let tracks = ofp.tracks;
  expect(tracks.length).toEqual(5);
  expect(tracks[0].isMine).toBeFalsy();
  expect(tracks[0].isComplete).toBeTruthy();
  expect(tracks[0].points.length).toEqual(6);

  expect(tracks[1].isMine).toBeTruthy();
  expect(tracks[1].isComplete).toBeTruthy();
  expect(tracks[1].points.length).toEqual(6);
});

test("lidoRoute", () => {
  expect(ofp.lidoRoute().join(" ")).toEqual("LFPG N4900.9E00225.0 N4907.1E00219.2 ATREX UT225 VESAN UL613 SOVAT UL613 SANDY UN601 LESTA UP6 RODOL UM65 TENSO L603 REMSI DCT GOMUP 58N020W 58N030W 57N040W 55N050W LOMSI DCT DANOL DCT ENE J121 SEY N4106.0W07207.2 N4055.8W07247.9 N4041.1W07302.0 N4041.2W07320.6 N4045.6W07337.8 KJFK KBOS");
});

test("lidoRoute do not replace SID/STAR", () => {
  expect(ofp.lidoRoute(false).join(" ")).toEqual("LFPG PG270 PG276 ATREX UT225 VESAN UL613 SOVAT UL613 SANDY UN601 LESTA UP6 RODOL UM65 TENSO L603 REMSI DCT GOMUP 58N020W 58N030W 57N040W 55N050W LOMSI DCT DANOL DCT ENE J121 SEY PARCH CCC ROBER CRAIL CAPIT KJFK KBOS");
});

test("ogimet route name", () => {
  const data = ogimetData(ofp, new GeoGridIndex());
  expect(data.route.name).toEqual('Route Gramet AF010 LFPG-KJFK 27Sep19 15:14z OFP 6');
  expect(data.proxy).toEqual('0-1569597240-8-350-');
});
test('wptNamesEET', () => {
  const results = ofp.wptNamesEET(ofp.wptCoordinates());
  expect(results.length === 0).toBeFalsy();
});
