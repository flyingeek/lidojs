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
    expect(infos.destination).toEqual("KSFO");
    expect(infos.ralts).toEqual(['BIKF', 'CYQX', 'CYEG']);
    expect(infos.alternates).toEqual(["KOAK"]);
    expect(infos.aircraft).toEqual("773");
    expect(infos.EEP.name).toEqual("BIKF");
    expect(infos.EXP.name).toEqual("CYEG");
    expect(infos.raltPoints.map(v => v.name)).toEqual(['BIKF','CYQX', 'CYEG']);
    expect(infos.ETOPS).toEqual(180);
  });
