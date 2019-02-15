/**
 * Templates are use dynamically, that's why we use functions.
 */


/**
 * Placemark renderer
 * @param {LatLng|GeoPoint} point
 * @param {string} name
 * @param {string} style - exemple '#placemark-red'
 * @param {string} description
 * @returns {string}
 */
export const pointTemplate = ({point, style}) => `
     <Placemark>
      <name><![CDATA[${point.name || point.dm}]]></name>
      <styleUrl>${style}</styleUrl>
      <description><![CDATA[${point.description || ''}]]></description>
      <Point>
        <coordinates>${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}</coordinates>
      </Point>
    </Placemark>
`;


/**
 * Line segment renderer
 * @param {string} coordinates - space separated list of lng,lat exemple "2.54,49.01 2.23,48.72 2.21,47.90"
 * @param {string} name
 * @param {string} style - exemple "#my-folder-name"
 * @returns {string}
 */
export const lineTemplate = ({coordinates, name, style, description}) => `
<Placemark>
  <name><![CDATA[${name}]]></name>
  <styleUrl>${style}</styleUrl>
  <description><![CDATA[${description}]]></description>
  <LineString>
    <tessellate>1</tessellate>
    <coordinates>${coordinates}</coordinates>
  </LineString>
</Placemark>
`;


/**
 * Line segment renderer
 * @param {string} coordinates - space separated list of lng,lat exemple "2.54,49.01 2.23,48.72"
 * @param {string} name
 * @param {string} style - exemple "#my-folder-name"
 * @returns {string}
 */
export const segmentTemplate = ({coordinates, name, style}) => `
<Placemark>
  <name><![CDATA[${name}]]></name>
  <styleUrl>${style}</styleUrl>
  <LineString>
    <coordinates>${coordinates}</coordinates>
  </LineString>
</Placemark>
`;


/**
 * Folder renderer
 * @param {string} name
 * @param {string} content
 * @param {string|number} [open=1] - not recognized by mapsme/avenza
 * @returns {string}
 */
export const folderTemplate = ({name, content, open=1}) => `
<Folder>
    <name>${name}</name>
    <open>${open}</open>
    ${content}
</Folder>
`;


/**
 * Global KML renderer
 * @param {string} name
 * @param {string} styles
 * @param {string} folders
 * @returns {string}
 */
export const template = ({name, styles, folders}) => `<?xml version='1.0' encoding='UTF-8'?>
<kml xmlns='http://www.opengis.net/kml/2.2'>
  <Document>
    <name><![CDATA[${name}]]></name>
        ${styles}
        ${folders}
  </Document>
</kml>
`;


/**
 * Global KML renderer for Avenza (uses an additional root folder)
 * @param {string} name
 * @param {string} styles
 * @param {string} folders
 * @returns {string}
 */
export const avenzaTemplate = ({name, styles, folders}) => `<?xml version='1.0' encoding='UTF-8'?>
<kml xmlns='http://www.opengis.net/kml/2.2'>
  <Document>
    <name><![CDATA[${name}]]></name>
        ${styles}
        <Folder><name><![CDATA[${name}]]></name>
        ${folders}
        </Folder>
  </Document>
</kml>
`;


/**
 * LineStyle Style renderer
 * @param {string} id - the style id, exemple: 'my-folder-name'
 * @param {string} color - kml color to use, inversed from web color: 641400FF for #FF0014 with 100% opacity
 * @param {number|string} [width=6] - the width of the line, set to 2 for Avenza
 * @returns {string}
 */
export const styleTemplate = ({id, color, width=6}) => `
    <Style id="${id}">
        <LineStyle>
            <width>${width}</width>
            <color>${color}</color>
        </LineStyle>
    </Style>
`;

export const avenzaStyleTemplate = ({id, color, width=3}) => styleTemplate({id, color, width});

/**
 * IconsStyle Style renderer
 * @param {string} id - the style id, exemple: "placemark-red"
 * @param {string} href - url of the icons (not used by mapsme)
 * @param {string} [x="0.5"] - hotspot zone x
 * @param {string} [y="0.0"] - hotspot zone y, set to "0.5" for Avenza
 * @returns {string}
 */
export const iconTemplate = ({id, href, x="0.5", y="0.0"}) => `
    <Style id="${id}">
        <IconStyle>
            <Icon>
                <href><![CDATA[${href}]]></href>
            </Icon>
            <hotSpot x="${x}"  y="${y}" xunits="fraction" yunits="fraction"/>
        </IconStyle>
    </Style>
`;

export const avenzaIconTemplate = ({id, href, x="0.5", y="0.5"}) => iconTemplate({id, href, x, y});
