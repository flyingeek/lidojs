export const PIN_NONE = 0
export const PIN_BLUE = 1
export const PIN_YELLOW = 2
export const PIN_BROWN = 3 // not available in Avenza
export const PIN_ORANGE = 4
export const PIN_PINK = 5 // not available in Avenza
export const PIN_RED = 6
export const PIN_GREEN = 7
export const PIN_PURPLE = 8

export const NAT_POSITION_ENTRY = 0
export const NAT_POSITION_EXIT = 1

export const PINS = [
    '#placemark-none', '#placemark-blue', '#placemark-yellow',
    '#placemark-brown', '#placemark-orange', '#placemark-pink',
    '#placemark-red', '#placemark-green', '#placemark-purple'];

export const GOOGLEICONS = [
    '', 'blu', 'ylw',
    'red', 'orange', 'pink',
    'red', 'grn', 'purple',
].map(c => ((c) ? `https://maps.google.com/mapfiles/kml/paddle/${c}-blank.png` : ''));

/**
 * Avenza is missing color 3 and 5: brown and pink displayed as red
 * @type {string[]}
 */
export const AVENZAICONS = [
    'null', 'blue', 'yellow',
    'red', 'orange', 'red',
    'red', 'green', 'purple',
].map(c => `http://download.avenza.com/images/pdfmaps_icons/pin-${c}-inground.png`);
