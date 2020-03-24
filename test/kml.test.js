/* eslint-env jest */
import {PIN_GREEN, PIN_NONE, PIN_ORANGE, PIN_RED} from "../src/modules/kml_constants";
import {GeoPoint} from "../src/modules/geopoint";
import {KMLGenerator} from "../src/modules/kml";
import {Route} from "../src/modules/route";

const lineTemplate = ({name, color}) => `${name} ${color}`;
const folderTemplate = ({content}) => `${content}`;
const pointTemplate = ({point, color="", style}) => `${point.name || point.dm}${color}${style}`;
const segmentTemplate = ({name, style, coordinates}) => `${name}/${style}/${coordinates}`;
const template = ({folders, name, extra}) => `${folders} ${name} ${extra}`;
let kml = null,
    p1 = null,
    p2 = null,
    p3 = null;

beforeEach(() => {
  kml = new KMLGenerator({pointTemplate, lineTemplate, folderTemplate, segmentTemplate,template});
  p1 = new GeoPoint([0, 0]);
  p2 = new GeoPoint([0, 45]);
  p3 = new GeoPoint([0, 90]);
});

test("add folder", () => {
    expect(kml.folders.size).toEqual(0);
    kml.addFolder('first');
    expect(kml.folders.get('first')).toBeInstanceOf(Object);
    kml.addFolder('second');
    expect(Array.from(kml.folders.keys())).toEqual(['first', 'second']);
});

test("add folders", () => {
    kml.addFolders({'name': 'first'}, {'name': 'second'});
    expect(Array.from(kml.folders.keys())).toEqual(['first', 'second']);
});

test("computeOptions", () => {
    kml.addFolder('folder');
    let options = kml.computeOptions('folder');
    expect(options.style).toEqual('#folder');
    options = kml.computeOptions('folder', {'style': 'test'});
    expect(options.style).toEqual('test');
    options = kml.computeOptions('folder', {'style': PIN_NONE});
    expect(options.style).toEqual('#placemark-none');
});

test("addLine", () => {
    kml.addFolder('aFolder');
    const route = new Route([p1, p2], {"name": "route"});
    // noinspection JSCheckFunctionSignatures
    kml.addLine('aFolder', route, {"color": "blouge"});
    expect(kml.renderFolder('aFolder')).toEqual("route blouge");
});

test("addPoints", () => {
    kml.addFolder('aFolder', {"pinId": PIN_ORANGE});
    const route = new Route([p1, p3], {"name": "route"});
    // noinspection JSCheckFunctionSignatures
    kml.addPoints('aFolder', route, {"color": "blouge"});
    expect(kml.renderFolder('aFolder'))
        .toEqual(
            "N0000.0W00000.0blouge#placemark-orange\n"
            + "N0000.0E09000.0blouge#placemark-orange");
});

test("addSegments", () => {
    kml.addFolder('aFolder', {"pinId": PIN_ORANGE});
    // noinspection CommaExpressionJS
    p1.name = "p1", p2.name = "p2", p3.name = "p3";
    const route = new Route([p1, p2, p3], {"name": "route"});
    // noinspection JSCheckFunctionSignatures
    kml.addPoints('aFolder', route, {"color": "blouge"});
    expect(kml.renderFolder('aFolder')).toEqual(
        'p1blouge#placemark-orange\np2blouge#placemark-orange\np3blouge#placemark-orange');
});

describe("Adding point when folder pin is NOT set", () => {
    test("no output after adding a point without style", () => {
        p1.name = "P1";
        kml.addFolder('aFolder');
        kml.addPoint('aFolder', p1);
        expect(kml.renderFolder('aFolder')).toEqual('');
    });
    test("output after adding a point with a style", () => {
        p1.name = "P1";
        kml.addFolder('aFolder');
        kml.addPoint('aFolder', p1, {"color": 'blouge', "style": '#style'});
        expect(kml.renderFolder('aFolder')).toEqual('P1blouge#style');
    });
});

describe("Adding point when folder pin is set", () => {
    test("point without style inherit style from folder pin", () => {
        p1.name = "P1";
        kml.addFolder('aFolder', {"pinId": PIN_ORANGE});
        // noinspection JSCheckFunctionSignatures
        kml.addPoint('aFolder', p1, {"color": 'blouge'});
        expect(kml.renderFolder('aFolder')).toEqual('P1blouge#placemark-orange');
    });
    test("point with style still use his own style", () => {
        p1.name = "P1";
        kml.addFolder('aFolder', {"pinId": PIN_ORANGE});
        kml.addPoint('aFolder', p1, {"color": 'blouge', "style": PIN_RED});
        expect(kml.renderFolder('aFolder')).toEqual('P1blouge#placemark-red');
    });
});

test("render", () => {
    p1.name = "P1";
    kml.folderTemplate = ({name, open, content}) => `${name} ${open} ${content}`;
    // noinspection JSCheckFunctionSignatures
    kml.addFolder('aFolder', {"open": 1});
    kml.addPoint('aFolder', p1, {"color": 'blouge', "style": '#mystyle'});
    const output = kml.render({"extra": "what else ?", "name": "no name", "aFolder_color": "white"});
    expect(output).toBe('aFolder 1 P1blouge#mystyle no name what else ?');
});

test("renderFolder", () => {
    p1.name = "P1";
    kml.folderTemplate = ({name, open, content}) => `${name} ${open} ${content}`;
    // noinspection JSCheckFunctionSignatures
    kml.addFolder('aFolder', {"open": 1});
    kml.addPoint('aFolder', p1, {"color": 'blouge', "style": '#mystyle'});
    const output = kml.renderFolder('aFolder');
    expect(output).toBe('aFolder 1 P1blouge#mystyle');
});

test("renderFolders", () => {
    // noinspection CommaExpressionJS
    p1.name = "P1", p2.name = "P2";
    kml.folderTemplate = ({name, open, content}) => `${name} ${open} ${content}`;
    kml.addFolders(
        {"name": 'aFolder', "open": 1},
        {"name": "another", "pinId": PIN_RED, "open": 1});
    kml.addPoint('aFolder', p1, {"color": 'blouge', "style": '#mystyle'});
    // noinspection JSCheckFunctionSignatures
    kml.addPoint('another', p2, {"color": 'red'});
    const output = kml.renderFolders();
    expect(output).toBe('aFolder 1 P1blouge#mystyle\nanother 1 P2red#placemark-red');
});

test("as kml lines", () => {
    kml.lineTemplate = ({name, style, description, coordinates}) => `${name}/${style}/${description}/${coordinates}`;
    const route = new Route([p1, p3], {"name": "route_name", "description": "route_description"});
    kml.addFolder('aFolder');
    kml.addLine('aFolder', route, {"style": "route_style"});
    expect(kml.renderFolder('aFolder'))
        .toBe('route_name/route_style/route_description/0.000000,0.000000 90.000000,0.000000');
});

test("as kml segments", () => {
    // noinspection CommaExpressionJS
    p1.name = "P1", p2.name = "P2", p3.name = "P3";
    const route = new Route([p1, p2, p3], {"name": "route_name", "description": "route_description"});
    kml.addFolder('aFolder');
    kml.addSegments('aFolder', route, {"style": "route_style"});
    expect(kml.renderFolder('aFolder'))
        .toBe(
            'route_name: P1->P2/route_style/0.000000,0.000000 45.000000,0.000000\n'
            + 'route_name: P2->P3/route_style/45.000000,0.000000 90.000000,0.000000');
});

test("as kml points", () => {
    // noinspection CommaExpressionJS
    p1.name = "P1", p2.name = "P2", p2.description = "D2";
    kml.pointTemplate = ({point, style}) => `${point.name || point.dm}/${style}/${point.description||''}/${point.longitude}, ${point.latitude}`;
    const route = new Route([p1, p2], {"name": "route_name", "description": "route_description"});
    kml.addFolder('aFolder');
    kml.addPoints('aFolder', route, {"style": "point_style"});
    expect(kml.render({
        "name": "KML points",
        "extra": "a test"
    })).toBe('P1/point_style//0, 0\nP2/point_style/D2/45, 0 KML points a test');
});

test("change pin of a folder", () => {
    kml.addFolder('aFolder', {"pinId": PIN_ORANGE});
    const route = new Route([p1, p3], {"name": "route"});
    kml.addPoints('aFolder', route);
    kml.folders.get('aFolder').pin = PIN_RED;
    expect(kml.renderFolder('aFolder'))
        .toEqual(
            "N0000.0W00000.0#placemark-red\n"
            + "N0000.0E09000.0#placemark-red");
    kml.changeFolderPin('aFolder', PIN_GREEN);
        expect(kml.renderFolder('aFolder'))
        .toEqual(
            "N0000.0W00000.0#placemark-green\n"
            + "N0000.0E09000.0#placemark-green");
});

test("changeFolderColor", () => {
    kml.styleTemplate = ({color}) => `${color}`;
    // noinspection JSCheckFunctionSignatures
    kml.addFolder('aFolder', {"color": "64102030"});
    kml.changeFolderColor("aFolder", "64FFEEDD");
    expect(kml.folders.get("aFolder").lineStyle.color).toBe("64FFEEDD");
});

test.skip("test_kml_ofp374_22Jul2016", () => {
    //TODO, based on OFP
});

test.skip("test_kml_segments_ofp6752_05Feb2017", () => {
    //TODO, based on OFP
});
