/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString, loadWmo} from "../test/utils"
import {Ofp} from "../src/modules/ofp";
import {GeoGridIndex} from "../src/modules/geoindex";
import {ogimetRoute, ogimetData} from "../src/modules/ogimet";

const ofpText = loadDataAsString("AF191_VOBL-LFPG_30Dec2016_21:50z_OFP_20_0_1.txt");
const ofp = new Ofp(ofpText);
const wmoGrid = new GeoGridIndex();
wmoGrid.data = loadWmo();


test('ogimetRoute', () => {
  const ogirte = ogimetRoute(wmoGrid, ofp.route);
  const names = ogirte.points
                .filter(p => p.name !== "")
                .map(p => p.name)
                .join(' ');
  expect(names).toEqual("43296 43264 43161 43158 OIKB 40851 40821 OIIK OITZ OITT 17024 15561 15499 15460 15182 11880 11628 11406 10605 06484 LFPG");
});

test('ogimetData', () => {
  const data = ogimetData(ofp, wmoGrid);
  expect(data.wmo.join(' ')).toEqual("43296 43264 43161 43158 OIKB 40851 40821 OIIK OITZ OITT 17024 15561 15499 15460 15182 11880 11628 11406 10605 06484 LFPG");
  expect(data.url.length).toBeGreaterThan(10);
});
