/* eslint-env jest */
/* eslint-disable sort-imports */
import {loadDataAsString, loadWmo} from "../test/utils"
import {Ofp} from "../src/modules/ofp";
import {GeoGridIndex} from "../src/modules/geoindex";
import {ogimetRoute} from "../src/modules/ogimet";

const ofpText = loadDataAsString("AF010_LFPG-KJFK_27Sep2019_1450z_OFP_6_nvp_pdfjs.txt");
const ofp = new Ofp(ofpText);
const wmoGrid = new GeoGridIndex();
wmoGrid.data = loadWmo();


test('ogimetRoute', () => {
  const ogirte = ogimetRoute(wmoGrid, ofp.route, 300, "ogimet route");
  const names = ogirte.points
                .filter(p => p.name !== "")
                .map(p => p.name)
                .join(' ');
  expect(names).toEqual("LFPG LFPB 07002 03559 03354 EGNH 03916 CWCA 71513 71634 KPWM KBOS KPVD 72501 72505 KJFK");
});
