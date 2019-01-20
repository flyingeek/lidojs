/* eslint-disable max-lines */
import {GOOGLEICONS, PINS, PIN_NONE} from "./kml_constants";
import {
    folderTemplate, iconTemplate, lineTemplate, pointTemplate, segmentTemplate, styleTemplate, template
} from "./kml_templates";

/**
 * KMLFolder class
 * this a KML folder representation optimized for recreating live the KML:
 * @property {boolean} enabled - toggle the linestring visibility
 * @property {number} pin - change placemark icon style
 */
const pinProp = Symbol('pin private property');

class KMLFolder {

    /**
     * create a folder
     * @param {string} name
     * @param {Object} options - options is send to the kml renderer
     * @param {number} [options.pinId] - the pinId used by this folder
     * @param {boolean} [options.enabled=true] - show/hide this folder output's
     */
    constructor(name, options={}){
        this.name = name;
        this.options = options;
        this.linestrings = []; // {String[]}
        this.placemarks = []; // {Object[]}
        this.lineStyle = '';
        this[pinProp] = options.pinId || PIN_NONE;
        this.enabled = options.enabled || true;
    }
    get pin() {
        return this[pinProp];
    }

    /**
     * set a new default pin value for the folder
     * @param {number} newValue - the new pin to use
     */
    set pin(newValue){
        const oldStyle = PINS[this[pinProp]];
        this[pinProp] = newValue;
        const newStyle = PINS[newValue];
        //replace all styles using oldStyle with newStyle
        this.placemarks = this.placemarks.map(o => {
            if (o.style === oldStyle) {
                o.style = newStyle;
            }
            return o;
        });
    }
}

/**
 * KMLGenerator class
 * it's a virtual representation of kml elements
 *
 * The python version filter elements on input.
 * To allow reactive rendering, here we filter elements on output
 *
 * Change
 */
class KMLGenerator {

    /**
     * Create a KML generator
     * @param {Object} [renderers]
     * @param {function} [renderers.template=template] - global template renderer
     * @param {function} [renderers.pointTemplate=pointTemplate] - placemark rendere
     * @param {function} [renderers.lineTemplate=lineTemplate] - linestring renderer
     * @param {function} [renderers.folderTemplate=folderTemplate] - folder renderer
     * @param {function} [renderers.styleTemplate=styleTemplate] - style renderer for linestring
     * @param {function} [renderers.iconTemplate=iconTemplate] - style renderer for placemarks
     * @param {function} [renderers.segmentTemplate=segmentTemplate] - linestring segments renderer
     * @param {function} [renderers.icons=GOOGLEICONS] - icons (pins) to use
     */
    constructor(renderers) {
        this.folders = new Map();
        this.template = renderers.template || template;
        this.pointTemplate = renderers.pointTemplate || pointTemplate;
        this.lineTemplate = renderers.lineTemplate || lineTemplate;
        this.folderTemplate = renderers.folderTemplate || folderTemplate;
        this.styleTemplate = renderers.styleTemplate || styleTemplate;
        this.iconTemplate = renderers.iconTemplate || iconTemplate;
        this.segmentTemplate = renderers.segmentTemplate || segmentTemplate;
        this.icons = renderers.icons || GOOGLEICONS;
    }

    /**
     * replace common invalid xml characters from a string
     * @param {string} text
     * @returns {string}
     */
    static escape (text) {
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }

    /**
     * determine style using pin[options.style]/options.style/#folderName
     * @param {string} folderName
     * @param {?Object} options
     * @param {string|number} [options.style]
     * @param {boolean} [folderPinInherit=false] - consider folder pin if defined
     * @returns {Object} options - new options to use
     */
    computeOptions (folderName, options={}, folderPinInherit=false) {
        options = {...options}; // work on a copy
        if (folderPinInherit && options.style === undefined) {
            let {style = this.folders.get(folderName).pin} = options;
            options.style = style;
        }
        if (options.style === undefined) {
            options.style = '#' + folderName;
        } else if (!isNaN(options.style)) {
            options.style = PINS[options.style];
        }
        return options; // return a copy of options with a style override
    }

    /**
     * add a folder in our virtual kml
     * @param {string} name
     * @param {Object} options - options passed to the template
     * @param {number} [options.pinId=0] - the pin identifier
     */
    addFolder (name, options={}) {
        // create a folder entry and add necessary styles
        let folder = new KMLFolder(name, options);
        this.folders.set(name, folder);
        let value = {'id': name, 'color': name + '_color'};
        folder.lineStyle = this.styleTemplate({...value, ...options});
    }

    /**
     * add multiple folders in our virtual kml
     * @param {...{string|Object}} items - ...{name, [pin=0], ...}
     * @param {string} items.name - folder name
     * @param {number} items.pin - folder pinId
     */
    addFolders (...items) {
        for (let value of items) {
            if (typeof(value) === 'string' || value instanceof String){
                this.addFolder(value);
            } else {
                let clone = {...value}; // get a copy
                Reflect.deleteProperty(clone, "name");
                this.addFolder(value.name, clone);
            }
        }
    }

    /**
     * add a route as line in a folder
     * @param {string} folderName
     * @param {Route} route
     * @param {?Object} [options] - options is passed to the kml template
     * @param {string|number} [options.style] - style will be computed based on this value
     */
    addLine(folderName, route, options={}) {
        options = this.computeOptions(folderName, options);
        let value = {
            'name': options.name || route.name,
            'style': options.style,
            'description': options.description || route.description
        };
        this.folders.get(folderName).linestrings.push(
            this.renderLine(route.points, {...value, ...options})); //options override value

    }

    /**
     * add route as points in a folder
     * @param {string} folderName
     * @param {Route} route
     * @param {?Object} [options] - options is passed to the kml template
     * @param {string|number} [options.style] - style will be computed based on this value
     * @param {Array} [options.excluded=[]] - a list of points to omit
     */
    addPoints(folderName, route, options={}) {
        const excluded = options.excluded || [];
        options = this.computeOptions(folderName, options, true);
        for (let point of route.points) {
            if (excluded.indexOf(point) >= 0) {
                options.style = PIN_NONE;
            }
            this.addPoint(folderName, point, options);
        }
    }

    /**
     * add a point to a folder
     * @param {string} folderName
     * @param {GeoPoint} point
     * @param {?Object} [options] - options is passed to the kml template
     * @param {string|number} [options.style] - style will be computed based on this value (with folder pin's inheritance)
     */
    addPoint ( folderName, point, options={}) {
        options = this.computeOptions(folderName, options, true);
        // as each point may have a dynamic style option,
        // we delegate the rendering to the folder by storing objects instead of string
        this.folders.get(folderName)
            .placemarks.push({point, ...options});
    }

    /**
     * add a route as line in a folder
     * @param {string} folderName
     * @param {Route} route
     * @param {?Object} [options] - options is passed to the kml template
     * @param {string|number} [options.style] - style will be computed based on this value
     */
    addSegments(folderName, route, options={}) {
        options = this.computeOptions(folderName, options);
        for (let [p1, p2] of route.segments){
            const label = route.name || folderName;
            const value = {
                'name': `${label}: ${p1.name || p1.dm}->${p2.name || p2.dm}`,
            }
            this.folders.get(folderName).linestrings.push(
                this.renderLine([p1, p2], {...value, ...options}, true));// options override value
        }
    }

    /**
     * render the whole KML
     * @param {Route} route
     * @param {?Object} [options={}] - options is passed to the kml templates
     * @returns {string}
     */
    render(options={}){
        let styles = '';
        PINS.forEach((value, index) => {
            if (index !== 0) {
                value = {'id': PINS[index].slice(1), 'href': this.icons[index]};
                styles += this.iconTemplate({...value, ...options});
            }
        });

        for (let [,folder] of this.folders){
            if (folder.enabled) {
                styles += folder.lineStyle
            }
        }
        return this.template({...options, "styles": styles, "folders": this.renderFolders()});
    }

    /**
     * render a single folder
     * @param {string|KMLFolder} folder - accepts a name or a Map iteration element
     * @returns {string}
     */
    renderFolder (folder, renderer=this.folderTemplate){
        if (typeof(folder) === 'string' || folder instanceof String) {
            folder = this.folders.get(folder);
        }
        if (!folder.enabled) return '';
        // linestrings never change the folder is simply enabled or disabled
        // placemarks are dynamic due to the excluded parameter
        let placemarks = [];
        if (folder.pin === PIN_NONE || folder.pin === undefined){
            placemarks = folder.placemarks
                .filter(o => o.style !== PINS[PIN_NONE] && o.style !== undefined);
        } else {
            placemarks = folder.placemarks
                .filter(o => o.style !== PINS[PIN_NONE]);
        }
        let value = {
            "name": folder.name,
            "content": folder.linestrings.concat(
                placemarks.map(o => this.pointTemplate(o, o.style)))
                .join('\n')
        };
        return renderer({...value, ...folder.options});
    }

    /**
     * render all folders
     * @returns {string}
     */
    renderFolders () {
        let output = [];
        for (let [, folder] of this.folders) {
            output.push(this.renderFolder(folder));
        }
        return output.join('\n');
    }

    /**
     * line/segment renderer
     * @param {GeoPoint[]} points
     * @param {?Object} [options={}] - options is passed to the kml template
     * @param {boolean} isSegment - determine the template: segment or line
     * @returns {string}
     */
    renderLine (points, options={}, isSegment=false){
        const tpl = (p) => `${p.longitude.toFixed(6)}, ${p.latitude.toFixed(6)}`;
        const coordinates = points.map(p => tpl(p)).join(' ');
        const value = {...options, coordinates};
        return isSegment ? this.segmentTemplate(value) : this.lineTemplate(value);
    }

    /**
     * Change the Style of a folder, thus changing color
     * @param {string} name
     * @param {string} color
     * @param {Object} [options] - additional options passed to the template
     */
    changeFolderColor(name, color, options={}){
        const value = {'id': name, 'color': color};
        const folder = this.folders.get(name);
        folder.lineStyle = this.styleTemplate({...value, ...options});
    }

    /**
     * Change folder pin shortcut
     * @param {string} name
     * @param {number} pin - the pin id
     */
    changeFolderPin(name, pin){
        this.folders.get(name).pin = pin
    }
}

export {KMLGenerator};
